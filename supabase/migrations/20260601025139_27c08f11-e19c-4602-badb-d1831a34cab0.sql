
-- ============================================================
-- Phase 7: RLS fixes + data normalization + new tables
-- ============================================================

-- 1) Parent SELECT on entry tables (so !inner joins work)
CREATE POLICY "Parents read approved attendance_entries"
  ON public.attendance_entries FOR SELECT TO authenticated
  USING (
    status = 'approved'
    AND class_id IN (
      SELECT s.class_id FROM public.students s
      JOIN public.parent_links pl ON pl.student_id = s.id
      JOIN public.parents p ON p.id = pl.parent_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents read approved daily_marks_entries"
  ON public.daily_marks_entries FOR SELECT TO authenticated
  USING (
    status = 'approved'
    AND class_id IN (
      SELECT s.class_id FROM public.students s
      JOIN public.parent_links pl ON pl.student_id = s.id
      JOIN public.parents p ON p.id = pl.parent_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents read approved exam_marks_entries"
  ON public.exam_marks_entries FOR SELECT TO authenticated
  USING (
    status = 'approved'
    AND class_id IN (
      SELECT s.class_id FROM public.students s
      JOIN public.parent_links pl ON pl.student_id = s.id
      JOIN public.parents p ON p.id = pl.parent_id
      WHERE p.user_id = auth.uid()
    )
  );

-- 2) Normalize fee_payments.month to YYYY-MM
UPDATE public.fee_payments
SET month = to_char(paid_on, 'YYYY-MM')
WHERE month !~ '^\d{4}-\d{2}$';

-- 3) Cleanup duplicate parents (orphans w/o user_id with bound twin)
-- Move any parent_links from the orphan to the user-bound twin first
UPDATE public.parent_links pl
SET parent_id = bound.id
FROM public.parents orphan
JOIN public.parents bound
  ON bound.user_id IS NOT NULL
 AND lower(coalesce(bound.full_name,'')) = lower(coalesce(orphan.full_name,''))
 AND coalesce(bound.phone,'') = coalesce(orphan.phone,'')
WHERE orphan.user_id IS NULL
  AND pl.parent_id = orphan.id
  AND NOT EXISTS (
    SELECT 1 FROM public.parent_links pl2
    WHERE pl2.parent_id = bound.id AND pl2.student_id = pl.student_id
  );

-- Now delete orphan parents that have no remaining links AND a bound twin exists
DELETE FROM public.parents orphan
USING public.parents bound
WHERE orphan.user_id IS NULL
  AND bound.user_id IS NOT NULL
  AND lower(coalesce(bound.full_name,'')) = lower(coalesce(orphan.full_name,''))
  AND coalesce(bound.phone,'') = coalesce(orphan.phone,'')
  AND NOT EXISTS (
    SELECT 1 FROM public.parent_links pl WHERE pl.parent_id = orphan.id
  );

-- 4) Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience TEXT NOT NULL DEFAULT 'parent',  -- parent | operator | admin | all
  student_id UUID NULL,                     -- if set, only parents of that student see it
  class_id UUID NULL,                       -- if set, parents of students in that class see it
  parent_user_id UUID NULL,                 -- if set, only that specific user sees it
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info',        -- info | attendance | exam | fee | ptm | activity
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'operator')
    AND created_by = auth.uid()
  );

CREATE POLICY "Operators read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Parents read targeted notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'parent') AND (
      parent_user_id = auth.uid()
      OR audience = 'all'
      OR (
        student_id IS NOT NULL AND student_id IN (
          SELECT pl.student_id FROM public.parent_links pl
          JOIN public.parents p ON p.id = pl.parent_id
          WHERE p.user_id = auth.uid()
        )
      )
      OR (
        class_id IS NOT NULL AND class_id IN (
          SELECT s.class_id FROM public.students s
          JOIN public.parent_links pl ON pl.student_id = s.id
          JOIN public.parents p ON p.id = pl.parent_id
          WHERE p.user_id = auth.uid()
        )
      )
    )
  );

CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- 5) Notification reads
CREATE TABLE public.notification_reads (
  notification_id UUID NOT NULL,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_reads TO authenticated;
GRANT ALL ON public.notification_reads TO service_role;

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reads"
  ON public.notification_reads FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6) PTM reports
CREATE TABLE public.ptm_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  period TEXT NOT NULL,                 -- e.g. "May 2026" or "Q1 2026"
  meeting_date DATE,
  summary TEXT,
  strengths TEXT,
  improvements TEXT,
  action_items TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ptm_reports TO authenticated;
GRANT ALL ON public.ptm_reports TO service_role;

ALTER TABLE public.ptm_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ptm_reports"
  ON public.ptm_reports FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators read ptm_reports"
  ON public.ptm_reports FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'operator'));

CREATE POLICY "Parents read own children ptm_reports"
  ON public.ptm_reports FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT pl.student_id FROM public.parent_links pl
      JOIN public.parents p ON p.id = pl.parent_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_ptm_reports_updated_at
  BEFORE UPDATE ON public.ptm_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7) Activities (co-curricular)
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'event',   -- event | competition | trip | other
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage activities"
  ON public.activities FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authed read activities"
  ON public.activities FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.activity_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL,
  student_id UUID NOT NULL,
  position INTEGER,                  -- 1, 2, 3, ... NULL = participated
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_results TO authenticated;
GRANT ALL ON public.activity_results TO service_role;

ALTER TABLE public.activity_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage activity_results"
  ON public.activity_results FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authed read activity_results"
  ON public.activity_results FOR SELECT TO authenticated
  USING (true);
