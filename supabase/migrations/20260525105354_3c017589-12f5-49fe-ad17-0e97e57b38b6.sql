
ALTER VIEW public.verification_queue SET (security_invoker = true);

REVOKE ALL ON FUNCTION public.app_generate_student_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.app_promote_admission(uuid, uuid, uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.app_promote_admission(uuid, uuid, uuid, date) TO authenticated;
REVOKE ALL ON FUNCTION public.audit_trigger() FROM PUBLIC, anon, authenticated;
