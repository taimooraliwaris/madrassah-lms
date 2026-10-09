-- Fix 1: Add role check to app_submit_daily_marks_matrix RPC
CREATE OR REPLACE FUNCTION public.app_submit_daily_marks_matrix(_class_id uuid, _date date, _payload jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  rec jsonb;
  mark jsonb;
  v_entry_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(v_user, 'admin'::public.app_role) OR public.has_role(v_user, 'operator'::public.app_role)) THEN
    RAISE EXCEPTION 'Only admins or operators can submit marks';
  END IF;
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
$function$;

-- Fix 2: Add explicit operator role check to "Operators read own *" SELECT policies
DROP POLICY IF EXISTS "Operators read own attendance_entries" ON public.attendance_entries;
CREATE POLICY "Operators read own attendance_entries" ON public.attendance_entries
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() AND public.has_role(auth.uid(), 'operator'::public.app_role));

DROP POLICY IF EXISTS "Operators read own daily_marks_entries" ON public.daily_marks_entries;
CREATE POLICY "Operators read own daily_marks_entries" ON public.daily_marks_entries
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() AND public.has_role(auth.uid(), 'operator'::public.app_role));

DROP POLICY IF EXISTS "Operators read own exam_marks_entries" ON public.exam_marks_entries;
CREATE POLICY "Operators read own exam_marks_entries" ON public.exam_marks_entries
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() AND public.has_role(auth.uid(), 'operator'::public.app_role));

DROP POLICY IF EXISTS "Operators read own fee_payments" ON public.fee_payments;
CREATE POLICY "Operators read own fee_payments" ON public.fee_payments
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() AND public.has_role(auth.uid(), 'operator'::public.app_role));