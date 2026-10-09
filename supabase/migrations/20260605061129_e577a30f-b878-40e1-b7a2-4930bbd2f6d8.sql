ALTER TABLE public.ptm_reports
  ADD CONSTRAINT ptm_reports_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.activity_results
  ADD CONSTRAINT activity_results_activity_id_fkey
  FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

ALTER TABLE public.activity_results
  ADD CONSTRAINT activity_results_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;