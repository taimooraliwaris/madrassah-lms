
-- =========================================================
-- Phase 4: Operator entry tables + verification wiring
-- =========================================================

-- Enums
DO $$ BEGIN CREATE TYPE public.entry_status AS ENUM ('pending','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.attendance_mark AS ENUM ('present','absent','late','excused'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.daily_grade AS ENUM ('aala','behter','munasib','kamzore','naaga'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_method AS ENUM ('cash','bank','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.remark_scope AS ENUM ('individual','class'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Common columns helper trigger reused (set_updated_at already exists)

-- =============== 1. ATTENDANCE ===============
CREATE TABLE public.attendance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  submitted_by UUID NOT NULL,
  status public.entry_status NOT NULL DEFAULT 'pending',
  note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.attendance_entries TO authenticated;
GRANT ALL ON public.attendance_entries TO service_role;
ALTER TABLE public.attendance_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage attendance_entries" ON public.attendance_entries FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Operators insert own attendance_entries" ON public.attendance_entries FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid() AND has_role(auth.uid(),'operator'));
CREATE POLICY "Operators read own attendance_entries" ON public.attendance_entries FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE TRIGGER trg_attendance_entries_uat BEFORE UPDATE ON public.attendance_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.attendance_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.attendance_entries(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  status public.attendance_mark NOT NULL DEFAULT 'present',
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attendance_marks_entry ON public.attendance_marks(entry_id);
CREATE INDEX idx_attendance_marks_student ON public.attendance_marks(student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_marks TO authenticated;
GRANT ALL ON public.attendance_marks TO service_role;
ALTER TABLE public.attendance_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage attendance_marks" ON public.attendance_marks FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Operators manage own attendance_marks" ON public.attendance_marks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.attendance_entries e WHERE e.id = entry_id AND e.submitted_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.attendance_entries e WHERE e.id = entry_id AND e.submitted_by = auth.uid()));
CREATE POLICY "Parents read approved attendance_marks" ON public.attendance_marks FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.attendance_entries e WHERE e.id = entry_id AND e.status = 'approved')
    AND student_id IN (SELECT pl.student_id FROM public.parent_links pl JOIN public.parents p ON p.id = pl.parent_id WHERE p.user_id = auth.uid())
  );

-- =============== 2. DAILY MARKS ===============
CREATE TABLE public.daily_marks_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  submitted_by UUID NOT NULL,
  status public.entry_status NOT NULL DEFAULT 'pending',
  note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.daily_marks_entries TO authenticated;
GRANT ALL ON public.daily_marks_entries TO service_role;
ALTER TABLE public.daily_marks_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage daily_marks_entries" ON public.daily_marks_entries FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Operators insert own daily_marks_entries" ON public.daily_marks_entries FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid() AND has_role(auth.uid(),'operator'));
CREATE POLICY "Operators read own daily_marks_entries" ON public.daily_marks_entries FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE TRIGGER trg_daily_marks_entries_uat BEFORE UPDATE ON public.daily_marks_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.daily_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.daily_marks_entries(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  grade public.daily_grade NOT NULL,
  reason TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_daily_marks_entry ON public.daily_marks(entry_id);
CREATE INDEX idx_daily_marks_student ON public.daily_marks(student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_marks TO authenticated;
GRANT ALL ON public.daily_marks TO service_role;
ALTER TABLE public.daily_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage daily_marks" ON public.daily_marks FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Operators manage own daily_marks" ON public.daily_marks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.daily_marks_entries e WHERE e.id = entry_id AND e.submitted_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.daily_marks_entries e WHERE e.id = entry_id AND e.submitted_by = auth.uid()));
CREATE POLICY "Parents read approved daily_marks" ON public.daily_marks FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.daily_marks_entries e WHERE e.id = entry_id AND e.status = 'approved')
    AND student_id IN (SELECT pl.student_id FROM public.parent_links pl JOIN public.parents p ON p.id = pl.parent_id WHERE p.user_id = auth.uid())
  );

-- =============== 3. EXAM MARKS ===============
CREATE TABLE public.exam_marks_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_name TEXT NOT NULL,
  class_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  total_marks NUMERIC NOT NULL DEFAULT 100,
  submitted_by UUID NOT NULL,
  status public.entry_status NOT NULL DEFAULT 'pending',
  note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.exam_marks_entries TO authenticated;
GRANT ALL ON public.exam_marks_entries TO service_role;
ALTER TABLE public.exam_marks_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage exam_marks_entries" ON public.exam_marks_entries FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Operators insert own exam_marks_entries" ON public.exam_marks_entries FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid() AND has_role(auth.uid(),'operator'));
CREATE POLICY "Operators read own exam_marks_entries" ON public.exam_marks_entries FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE TRIGGER trg_exam_marks_entries_uat BEFORE UPDATE ON public.exam_marks_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.exam_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.exam_marks_entries(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  marks_obtained NUMERIC,
  is_absent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exam_marks_entry ON public.exam_marks(entry_id);
CREATE INDEX idx_exam_marks_student ON public.exam_marks(student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_marks TO authenticated;
GRANT ALL ON public.exam_marks TO service_role;
ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage exam_marks" ON public.exam_marks FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Operators manage own exam_marks" ON public.exam_marks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exam_marks_entries e WHERE e.id = entry_id AND e.submitted_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.exam_marks_entries e WHERE e.id = entry_id AND e.submitted_by = auth.uid()));
CREATE POLICY "Parents read approved exam_marks" ON public.exam_marks FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exam_marks_entries e WHERE e.id = entry_id AND e.status = 'approved')
    AND student_id IN (SELECT pl.student_id FROM public.parent_links pl JOIN public.parents p ON p.id = pl.parent_id WHERE p.user_id = auth.uid())
  );

-- =============== 4. REMARKS ===============
CREATE TABLE public.remarks_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  scope public.remark_scope NOT NULL DEFAULT 'individual',
  student_id UUID,
  category TEXT,
  severity TEXT,
  body TEXT NOT NULL,
  submitted_by UUID NOT NULL,
  status public.entry_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.remarks_entries TO authenticated;
GRANT ALL ON public.remarks_entries TO service_role;
ALTER TABLE public.remarks_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage remarks_entries" ON public.remarks_entries FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Operators insert own remarks_entries" ON public.remarks_entries FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid() AND has_role(auth.uid(),'operator'));
CREATE POLICY "Operators read own remarks_entries" ON public.remarks_entries FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "Parents read approved remarks_entries" ON public.remarks_entries FOR SELECT TO authenticated
  USING (status = 'approved' AND student_id IS NOT NULL AND student_id IN (SELECT pl.student_id FROM public.parent_links pl JOIN public.parents p ON p.id = pl.parent_id WHERE p.user_id = auth.uid()));
CREATE TRIGGER trg_remarks_entries_uat BEFORE UPDATE ON public.remarks_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============== 5. FEE PAYMENTS ===============
CREATE TABLE public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  month TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  method public.payment_method NOT NULL DEFAULT 'cash',
  reference_no TEXT,
  paid_on DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  submitted_by UUID NOT NULL,
  status public.entry_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.fee_payments TO authenticated;
GRANT ALL ON public.fee_payments TO service_role;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage fee_payments" ON public.fee_payments FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Operators insert own fee_payments" ON public.fee_payments FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid() AND has_role(auth.uid(),'operator'));
CREATE POLICY "Operators read own fee_payments" ON public.fee_payments FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "Parents read approved fee_payments" ON public.fee_payments FOR SELECT TO authenticated
  USING (status = 'approved' AND student_id IN (SELECT pl.student_id FROM public.parent_links pl JOIN public.parents p ON p.id = pl.parent_id WHERE p.user_id = auth.uid()));
CREATE TRIGGER trg_fee_payments_uat BEFORE UPDATE ON public.fee_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============== VERIFICATION QUEUE VIEW ===============
DROP VIEW IF EXISTS public.verification_queue;
CREATE VIEW public.verification_queue
WITH (security_invoker = true) AS
SELECT
  ae.id, 'attendance'::text AS entity_type, ae.id AS entity_id,
  ('Attendance · ' || COALESCE(c.name,'?') || ' · ' || to_char(ae.date,'YYYY-MM-DD')) AS label,
  ae.submitted_by, p.full_name AS submitted_by_name, ae.created_at AS submitted_at
FROM public.attendance_entries ae
LEFT JOIN public.classes c ON c.id = ae.class_id
LEFT JOIN public.profiles p ON p.id = ae.submitted_by
WHERE ae.status = 'pending'
UNION ALL
SELECT
  de.id, 'daily_marks', de.id,
  ('Daily Marks · ' || COALESCE(c.name,'?') || ' · ' || COALESCE(s.name,'?') || ' · ' || to_char(de.date,'YYYY-MM-DD')),
  de.submitted_by, p.full_name, de.created_at
FROM public.daily_marks_entries de
LEFT JOIN public.classes c ON c.id = de.class_id
LEFT JOIN public.subjects s ON s.id = de.subject_id
LEFT JOIN public.profiles p ON p.id = de.submitted_by
WHERE de.status = 'pending'
UNION ALL
SELECT
  ee.id, 'exam_marks', ee.id,
  ('Exam Marks · ' || ee.exam_name || ' · ' || COALESCE(c.name,'?') || ' · ' || COALESCE(s.name,'?')),
  ee.submitted_by, p.full_name, ee.created_at
FROM public.exam_marks_entries ee
LEFT JOIN public.classes c ON c.id = ee.class_id
LEFT JOIN public.subjects s ON s.id = ee.subject_id
LEFT JOIN public.profiles p ON p.id = ee.submitted_by
WHERE ee.status = 'pending'
UNION ALL
SELECT
  re.id, 'remark', re.id,
  ('Remark · ' || COALESCE(st.full_name, 'Class-wide')),
  re.submitted_by, p.full_name, re.created_at
FROM public.remarks_entries re
LEFT JOIN public.students st ON st.id = re.student_id
LEFT JOIN public.profiles p ON p.id = re.submitted_by
WHERE re.status = 'pending'
UNION ALL
SELECT
  fp.id, 'fee_payment', fp.id,
  ('Fee · ₨' || fp.amount::text || ' · ' || COALESCE(st.full_name,'?') || ' · ' || fp.month),
  fp.submitted_by, p.full_name, fp.created_at
FROM public.fee_payments fp
LEFT JOIN public.students st ON st.id = fp.student_id
LEFT JOIN public.profiles p ON p.id = fp.submitted_by
WHERE fp.status = 'pending';

GRANT SELECT ON public.verification_queue TO authenticated;

-- =============== DECISION RPC ===============
CREATE OR REPLACE FUNCTION public.app_decide_submission(
  _entity_type TEXT,
  _entity_id UUID,
  _approve BOOLEAN,
  _note TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.entry_status;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only admins can decide submissions';
  END IF;
  v_status := CASE WHEN _approve THEN 'approved'::public.entry_status ELSE 'rejected'::public.entry_status END;

  IF _entity_type = 'attendance' THEN
    UPDATE public.attendance_entries SET status=v_status, reviewed_by=auth.uid(), reviewed_at=now(), review_note=_note WHERE id=_entity_id;
  ELSIF _entity_type = 'daily_marks' THEN
    UPDATE public.daily_marks_entries SET status=v_status, reviewed_by=auth.uid(), reviewed_at=now(), review_note=_note WHERE id=_entity_id;
  ELSIF _entity_type = 'exam_marks' THEN
    UPDATE public.exam_marks_entries SET status=v_status, reviewed_by=auth.uid(), reviewed_at=now(), review_note=_note WHERE id=_entity_id;
  ELSIF _entity_type = 'remark' THEN
    UPDATE public.remarks_entries SET status=v_status, reviewed_by=auth.uid(), reviewed_at=now(), review_note=_note WHERE id=_entity_id;
  ELSIF _entity_type = 'fee_payment' THEN
    UPDATE public.fee_payments SET status=v_status, reviewed_by=auth.uid(), reviewed_at=now(), review_note=_note WHERE id=_entity_id;
  ELSE
    RAISE EXCEPTION 'Unknown entity_type: %', _entity_type;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.app_decide_submission(TEXT, UUID, BOOLEAN, TEXT) TO authenticated;
