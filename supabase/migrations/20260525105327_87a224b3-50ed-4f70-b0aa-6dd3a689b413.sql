
-- ============== ENUMS ==============
CREATE TYPE program_type AS ENUM ('hifz', 'nazra');
CREATE TYPE entity_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE employment_status AS ENUM ('active', 'on_leave', 'resigned');
CREATE TYPE admission_status AS ENUM ('pending', 'approved', 'rejected', 'info_requested');
CREATE TYPE audit_action AS ENUM ('insert', 'update', 'delete');

-- ============== TEACHERS ==============
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  father_name TEXT,
  dob DATE,
  gender TEXT CHECK (gender IN ('male','female')),
  cnic TEXT,
  phone TEXT,
  emergency_contact TEXT,
  photo_url TEXT,
  qualification TEXT,
  experience_years INTEGER DEFAULT 0,
  specializations TEXT[] DEFAULT '{}',
  joining_date DATE,
  employment_status employment_status NOT NULL DEFAULT 'active',
  user_id UUID UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_teachers_updated BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins manage teachers" ON public.teachers FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Operators read teachers" ON public.teachers FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'operator'));
CREATE POLICY "Teacher reads own" ON public.teachers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============== CLASSES ==============
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  program program_type NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '2024-2025',
  primary_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  status entity_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_classes_updated BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Admins manage classes" ON public.classes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Operators read classes" ON public.classes FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'operator'));
CREATE POLICY "Parents read classes" ON public.classes FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'parent'));

-- ============== SUBJECTS ==============
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program program_type NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(program, name)
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Authed read subjects" ON public.subjects FOR SELECT TO authenticated USING (true);

INSERT INTO public.subjects (program, name, sort_order) VALUES
  ('hifz','Sabaq',1),('hifz','Sabki',2),('hifz','Manzil',3),('hifz','Tarbiati Nisab',4),
  ('nazra','Nazra',1);

-- ============== TEACHER_CLASSES ==============
CREATE TABLE public.teacher_classes (
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, class_id)
);
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage teacher_classes" ON public.teacher_classes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Authed read teacher_classes" ON public.teacher_classes FOR SELECT TO authenticated USING (true);

-- ============== STUDENTS ==============
CREATE SEQUENCE IF NOT EXISTS public.student_code_seq START 1;

CREATE OR REPLACE FUNCTION public.app_generate_student_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n INT; y TEXT;
BEGIN
  n := nextval('public.student_code_seq');
  y := to_char(now(),'YYYY');
  RETURN 'MA-' || y || '-' || lpad(n::text,4,'0');
END;$$;

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code TEXT UNIQUE NOT NULL DEFAULT public.app_generate_student_code(),
  full_name TEXT NOT NULL,
  father_name TEXT,
  dob DATE,
  gender TEXT CHECK (gender IN ('male','female')),
  cnic TEXT,
  phone TEXT,
  address TEXT,
  photo_url TEXT,
  program program_type NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  assigned_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status entity_status NOT NULL DEFAULT 'active',
  previous_madrassah TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_students_updated BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_students_class ON public.students(class_id);
CREATE INDEX idx_students_status ON public.students(status);

CREATE POLICY "Admins manage students" ON public.students FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Operators read students" ON public.students FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'operator'));

-- ============== PARENTS ==============
CREATE TABLE public.parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  relation TEXT NOT NULL DEFAULT 'Father',
  phone TEXT NOT NULL,
  email TEXT,
  user_id UUID UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_parents_updated BEFORE UPDATE ON public.parents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_parents_phone ON public.parents(phone);

CREATE POLICY "Admins manage parents" ON public.parents FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Parent reads own" ON public.parents FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============== PARENT_LINKS ==============
CREATE TABLE public.parent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);
ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage parent_links" ON public.parent_links FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Parent reads own links" ON public.parent_links FOR SELECT TO authenticated
  USING (parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid()));

-- Parent reads their linked students
CREATE POLICY "Parent reads linked students" ON public.students FOR SELECT TO authenticated
  USING (id IN (
    SELECT pl.student_id FROM public.parent_links pl
    JOIN public.parents p ON p.id = pl.parent_id
    WHERE p.user_id = auth.uid()
  ));

-- ============== ADMISSIONS ==============
CREATE TABLE public.admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name TEXT NOT NULL,
  dob DATE,
  gender TEXT CHECK (gender IN ('male','female')),
  program program_type NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_email TEXT,
  address TEXT,
  notes TEXT,
  status admission_status NOT NULL DEFAULT 'pending',
  review_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  converted_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  source_inquiry_id UUID REFERENCES public.admission_inquiries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_admissions_updated BEFORE UPDATE ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_admissions_status ON public.admissions(status);

CREATE POLICY "Admins manage admissions" ON public.admissions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============== AUDIT LOG ==============
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action audit_action NOT NULL,
  before JSONB,
  after JSONB,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_at ON public.audit_log(at DESC);

-- Append-only: admins view, anyone authenticated can insert (via trigger context)
CREATE POLICY "Admins view audit" ON public.audit_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));
-- No update/delete policies → immutable

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_action audit_action;
  v_before JSONB;
  v_after JSONB;
  v_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'insert'; v_before := NULL; v_after := to_jsonb(NEW); v_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update'; v_before := to_jsonb(OLD); v_after := to_jsonb(NEW); v_id := NEW.id;
  ELSE
    v_action := 'delete'; v_before := to_jsonb(OLD); v_after := NULL; v_id := OLD.id;
  END IF;
  INSERT INTO public.audit_log(actor_id, entity_type, entity_id, action, before, after)
  VALUES (auth.uid(), TG_TABLE_NAME, v_id, v_action, v_before, v_after);
  RETURN COALESCE(NEW, OLD);
END;$$;

CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_teachers AFTER INSERT OR UPDATE OR DELETE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_classes AFTER INSERT OR UPDATE OR DELETE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_admissions AFTER INSERT OR UPDATE OR DELETE ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ============== ADMISSION PROMOTE RPC ==============
CREATE OR REPLACE FUNCTION public.app_promote_admission(
  _admission_id UUID,
  _class_id UUID,
  _teacher_id UUID,
  _enrollment_date DATE
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_admission public.admissions%ROWTYPE;
  v_parent_id UUID;
  v_student_id UUID;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only admins can promote admissions';
  END IF;

  SELECT * INTO v_admission FROM public.admissions WHERE id = _admission_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Admission not found'; END IF;
  IF v_admission.status = 'approved' THEN RAISE EXCEPTION 'Already approved'; END IF;

  -- Find or create parent by phone
  SELECT id INTO v_parent_id FROM public.parents WHERE phone = v_admission.parent_phone LIMIT 1;
  IF v_parent_id IS NULL THEN
    INSERT INTO public.parents (full_name, relation, phone, email)
    VALUES (v_admission.parent_name, 'Father', v_admission.parent_phone, v_admission.parent_email)
    RETURNING id INTO v_parent_id;
  END IF;

  -- Create student
  INSERT INTO public.students (
    full_name, dob, gender, program, class_id, assigned_teacher_id,
    enrollment_date, status, address
  ) VALUES (
    v_admission.applicant_name, v_admission.dob, v_admission.gender,
    v_admission.program, _class_id, _teacher_id,
    _enrollment_date, 'active', v_admission.address
  ) RETURNING id INTO v_student_id;

  -- Link parent
  INSERT INTO public.parent_links (parent_id, student_id, is_primary)
  VALUES (v_parent_id, v_student_id, true);

  -- Mark admission
  UPDATE public.admissions SET
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    converted_student_id = v_student_id
  WHERE id = _admission_id;

  RETURN v_student_id;
END;$$;

-- ============== VERIFICATION QUEUE VIEW (placeholder for Phase 4) ==============
CREATE OR REPLACE VIEW public.verification_queue AS
SELECT
  NULL::UUID AS id,
  NULL::TEXT AS entity_type,
  NULL::UUID AS entity_id,
  NULL::TEXT AS label,
  NULL::UUID AS submitted_by,
  NULL::TEXT AS submitted_by_name,
  NULL::TIMESTAMPTZ AS submitted_at
WHERE false;

GRANT SELECT ON public.verification_queue TO authenticated;
