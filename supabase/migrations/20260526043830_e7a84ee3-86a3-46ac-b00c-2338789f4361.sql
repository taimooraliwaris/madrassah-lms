
GRANT EXECUTE ON FUNCTION public.app_generate_student_code() TO authenticated;

CREATE OR REPLACE FUNCTION public.app_inquiry_to_admission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program public.program_type;
  v_gender TEXT;
BEGIN
  v_program := CASE lower(coalesce(NEW.program,'nazra'))
    WHEN 'hifz' THEN 'hifz'::public.program_type
    ELSE 'nazra'::public.program_type END;
  v_gender := CASE lower(coalesce(NEW.gender,''))
    WHEN 'male' THEN 'male'
    WHEN 'female' THEN 'female'
    ELSE NULL END;
  INSERT INTO public.admissions (
    applicant_name, program, gender, dob,
    parent_name, parent_phone, parent_email, address, notes,
    source_inquiry_id, status
  ) VALUES (
    NEW.student_name, v_program, v_gender, NEW.date_of_birth,
    NEW.parent_name, NEW.parent_phone, NEW.parent_email, NEW.address, NEW.message,
    NEW.id, 'pending'
  );
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_inquiry_to_admission ON public.admission_inquiries;
CREATE TRIGGER trg_inquiry_to_admission
AFTER INSERT ON public.admission_inquiries
FOR EACH ROW EXECUTE FUNCTION public.app_inquiry_to_admission();

INSERT INTO public.admissions (
  applicant_name, program, gender, dob,
  parent_name, parent_phone, parent_email, address, notes,
  source_inquiry_id, status, created_at
)
SELECT
  i.student_name,
  (CASE lower(coalesce(i.program,'nazra')) WHEN 'hifz' THEN 'hifz' ELSE 'nazra' END)::public.program_type,
  CASE lower(coalesce(i.gender,'')) WHEN 'male' THEN 'male' WHEN 'female' THEN 'female' ELSE NULL END,
  i.date_of_birth,
  i.parent_name, i.parent_phone, i.parent_email, i.address, i.message,
  i.id, 'pending', i.created_at
FROM public.admission_inquiries i
LEFT JOIN public.admissions a ON a.source_inquiry_id = i.id
WHERE a.id IS NULL;

DO $$ BEGIN CREATE TYPE public.approval_entity AS ENUM ('student','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.approval_action AS ENUM ('create','delete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.approval_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID NOT NULL,
  entity_type public.approval_entity NOT NULL,
  action public.approval_action NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  target_id UUID,
  status public.approval_status NOT NULL DEFAULT 'pending',
  decision_note TEXT,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage approval_requests" ON public.approval_requests;
CREATE POLICY "Admins manage approval_requests" ON public.approval_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Requesters view own" ON public.approval_requests;
CREATE POLICY "Requesters view own" ON public.approval_requests
  FOR SELECT TO authenticated USING (requested_by = auth.uid());

DROP POLICY IF EXISTS "Requesters insert own" ON public.approval_requests;
CREATE POLICY "Requesters insert own" ON public.approval_requests
  FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests(status);
