
-- 1. activity_results: restrict SELECT
DROP POLICY IF EXISTS "Authed read activity_results" ON public.activity_results;
CREATE POLICY "Read activity_results scoped"
  ON public.activity_results FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'operator'::app_role)
    OR (
      has_role(auth.uid(), 'parent'::app_role)
      AND student_id IN (
        SELECT pl.student_id
        FROM public.parent_links pl
        JOIN public.parents p ON p.id = pl.parent_id
        WHERE p.user_id = auth.uid()
      )
    )
  );

-- 2. approval_requests: restrict INSERT to operators
DROP POLICY IF EXISTS "Requesters insert own" ON public.approval_requests;
CREATE POLICY "Operators insert approval_requests"
  ON public.approval_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND has_role(auth.uid(), 'operator'::app_role)
  );

-- 3. notifications: restrict operator audience to their assigned classes / linked students
DROP POLICY IF EXISTS "Operators insert notifications" ON public.notifications;
CREATE POLICY "Operators insert notifications scoped"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'operator'::app_role)
    AND created_by = auth.uid()
    AND audience <> 'all'
    AND (
      (class_id IS NOT NULL AND class_id IN (
        SELECT tc.class_id
        FROM public.teacher_classes tc
        JOIN public.teachers t ON t.id = tc.teacher_id
        WHERE t.user_id = auth.uid()
      ))
      OR (student_id IS NOT NULL AND student_id IN (
        SELECT s.id FROM public.students s
        WHERE s.class_id IN (
          SELECT tc.class_id
          FROM public.teacher_classes tc
          JOIN public.teachers t ON t.id = tc.teacher_id
          WHERE t.user_id = auth.uid()
        )
      ))
      OR (parent_user_id IS NOT NULL AND parent_user_id IN (
        SELECT p.user_id
        FROM public.parents p
        JOIN public.parent_links pl ON pl.parent_id = p.id
        JOIN public.students s ON s.id = pl.student_id
        WHERE s.class_id IN (
          SELECT tc.class_id
          FROM public.teacher_classes tc
          JOIN public.teachers t ON t.id = tc.teacher_id
          WHERE t.user_id = auth.uid()
        )
      ))
    )
  );

-- 4. Lock down SECURITY DEFINER functions: revoke from anon/authenticated except RPC entrypoints
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.app_generate_student_code() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.app_inquiry_to_admission() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_trigger() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_parent_row() FROM anon, authenticated, PUBLIC;

-- get_primary_role is called by signed-in users via RPC; allow only authenticated
REVOKE EXECUTE ON FUNCTION public.get_primary_role(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_primary_role(uuid) TO authenticated;

-- RPC entrypoints used by operators/admins
REVOKE EXECUTE ON FUNCTION public.app_promote_admission(uuid, uuid, uuid, date) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_promote_admission(uuid, uuid, uuid, date) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.app_submit_daily_marks_matrix(uuid, date, jsonb) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_submit_daily_marks_matrix(uuid, date, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.app_decide_submission(text, uuid, boolean, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_decide_submission(text, uuid, boolean, text) TO authenticated;

-- 5. Branding bucket: stop allowing public listing. Public file URLs still work via CDN.
DROP POLICY IF EXISTS "Public read branding" ON storage.objects;
