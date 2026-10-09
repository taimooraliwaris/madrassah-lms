
-- Phase 6 migration

-- 1) Auto-create parents row when user_roles gets a 'parent' role
CREATE OR REPLACE FUNCTION public.ensure_parent_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_phone TEXT;
BEGIN
  IF NEW.role <> 'parent' THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.parents WHERE user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;
  SELECT full_name, phone INTO v_name, v_phone FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.parents (user_id, full_name, relation, phone, email)
  VALUES (NEW.user_id, COALESCE(v_name, 'Parent'), 'Father', COALESCE(v_phone, ''), NULL);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_parent_row ON public.user_roles;
CREATE TRIGGER trg_ensure_parent_row
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.ensure_parent_row();

-- Backfill: any existing parent role missing a parents row
INSERT INTO public.parents (user_id, full_name, relation, phone, email)
SELECT ur.user_id,
       COALESCE(p.full_name, 'Parent'),
       'Father',
       COALESCE(p.phone, ''),
       NULL
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.id = ur.user_id
LEFT JOIN public.parents pa ON pa.user_id = ur.user_id
WHERE ur.role = 'parent' AND pa.id IS NULL;

-- 2) Auto-approve non-sensitive entries: change default + backfill pending rows
ALTER TABLE public.attendance_entries  ALTER COLUMN status SET DEFAULT 'approved'::entry_status;
ALTER TABLE public.daily_marks_entries ALTER COLUMN status SET DEFAULT 'approved'::entry_status;
ALTER TABLE public.exam_marks_entries  ALTER COLUMN status SET DEFAULT 'approved'::entry_status;
ALTER TABLE public.remarks_entries     ALTER COLUMN status SET DEFAULT 'approved'::entry_status;

UPDATE public.attendance_entries  SET status='approved', reviewed_by=submitted_by, reviewed_at=now() WHERE status='pending';
UPDATE public.daily_marks_entries SET status='approved', reviewed_by=submitted_by, reviewed_at=now() WHERE status='pending';
UPDATE public.exam_marks_entries  SET status='approved', reviewed_by=submitted_by, reviewed_at=now() WHERE status='pending';
UPDATE public.remarks_entries     SET status='approved', reviewed_by=submitted_by, reviewed_at=now() WHERE status='pending';

-- 3) Rebuild verification_queue view to only contain fee_payments
DROP VIEW IF EXISTS public.verification_queue;
CREATE VIEW public.verification_queue
WITH (security_invoker=on) AS
SELECT
  fp.id,
  'fee_payment'::text AS entity_type,
  fp.id AS entity_id,
  ('Fee · ₨' || fp.amount::text || ' · ' || COALESCE(s.full_name,'?') || ' · ' || fp.month) AS label,
  fp.submitted_by,
  COALESCE(pr.full_name, '') AS submitted_by_name,
  fp.created_at AS submitted_at
FROM public.fee_payments fp
LEFT JOIN public.students s ON s.id = fp.student_id
LEFT JOIN public.profiles pr ON pr.id = fp.submitted_by
WHERE fp.status = 'pending';

GRANT SELECT ON public.verification_queue TO authenticated;
GRANT SELECT ON public.verification_queue TO service_role;

-- 4) Update settings.verification_rules default & row
ALTER TABLE public.settings ALTER COLUMN verification_rules SET DEFAULT
  '{"fee_payments": true, "remarks": false, "attendance": false, "exam_marks": false, "daily_marks": false}'::jsonb;
UPDATE public.settings
SET verification_rules = '{"fee_payments": true, "remarks": false, "attendance": false, "exam_marks": false, "daily_marks": false}'::jsonb
WHERE id = 1;

-- 5) Matrix submit RPC for daily marks across multiple subjects
CREATE OR REPLACE FUNCTION public.app_submit_daily_marks_matrix(
  _class_id uuid,
  _date date,
  _payload jsonb   -- [{subject_id, marks:[{student_id, grade, reason, remark}]}]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  rec jsonb;
  mark jsonb;
  v_entry_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  FOR rec IN SELECT * FROM jsonb_array_elements(_payload) LOOP
    INSERT INTO public.daily_marks_entries(class_id, subject_id, date, submitted_by)
    VALUES (_class_id, (rec->>'subject_id')::uuid, _date, v_user)
    RETURNING id INTO v_entry_id;
    FOR mark IN SELECT * FROM jsonb_array_elements(rec->'marks') LOOP
      INSERT INTO public.daily_marks(entry_id, student_id, grade, reason, remark)
      VALUES (
        v_entry_id,
        (mark->>'student_id')::uuid,
        (mark->>'grade')::daily_grade,
        NULLIF(mark->>'reason',''),
        NULLIF(mark->>'remark','')
      );
    END LOOP;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.app_submit_daily_marks_matrix(uuid, date, jsonb) TO authenticated;
