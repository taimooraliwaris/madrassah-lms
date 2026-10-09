GRANT EXECUTE ON FUNCTION public.app_generate_student_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_promote_admission(uuid, uuid, uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_decide_submission(text, uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_submit_daily_marks_matrix(uuid, date, jsonb) TO authenticated;