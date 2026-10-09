
-- Phase 8 migration

-- 1) Backfill any leftover pending statuses (verification flipped to approved by default)
UPDATE public.attendance_entries SET status='approved' WHERE status='pending';
UPDATE public.daily_marks_entries SET status='approved' WHERE status='pending';
UPDATE public.exam_marks_entries SET status='approved' WHERE status='pending';
UPDATE public.remarks_entries SET status='approved' WHERE status='pending';

-- 2) Deduplicate attendance_entries: keep oldest per (class_id, date), delete the rest
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY class_id, date ORDER BY created_at) AS rn
  FROM public.attendance_entries
), dupes AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM public.attendance_marks WHERE entry_id IN (SELECT id FROM dupes);
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY class_id, date ORDER BY created_at) AS rn
  FROM public.attendance_entries
)
DELETE FROM public.attendance_entries WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 3) Unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS attendance_entries_class_date_key
  ON public.attendance_entries(class_id, date);

-- 4) Settings: add branding / theme / language columns
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS primary_theme_id text DEFAULT 'emerald',
  ADD COLUMN IF NOT EXISTS themes jsonb DEFAULT '[
    {"id":"emerald","name":"Emerald","primary":"oklch(0.45 0.13 165)","accent":"oklch(0.72 0.12 75)","background":"oklch(0.98 0.01 95)","foreground":"oklch(0.2 0.02 165)"},
    {"id":"sapphire","name":"Sapphire","primary":"oklch(0.45 0.15 250)","accent":"oklch(0.7 0.13 60)","background":"oklch(0.98 0.005 250)","foreground":"oklch(0.2 0.02 250)"},
    {"id":"ruby","name":"Ruby","primary":"oklch(0.5 0.18 25)","accent":"oklch(0.7 0.12 80)","background":"oklch(0.98 0.005 25)","foreground":"oklch(0.2 0.02 25)"},
    {"id":"royal","name":"Royal Purple","primary":"oklch(0.45 0.17 300)","accent":"oklch(0.75 0.12 85)","background":"oklch(0.98 0.005 300)","foreground":"oklch(0.2 0.02 300)"},
    {"id":"midnight","name":"Midnight","primary":"oklch(0.55 0.13 230)","accent":"oklch(0.72 0.12 75)","background":"oklch(0.16 0.01 250)","foreground":"oklch(0.95 0.005 250)"}
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS default_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS urdu_enabled boolean DEFAULT true;

-- 5) Branding storage bucket (public read, admin write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read branding" ON storage.objects;
CREATE POLICY "Public read branding" ON storage.objects FOR SELECT
  USING (bucket_id = 'branding');

DROP POLICY IF EXISTS "Admins write branding" ON storage.objects;
CREATE POLICY "Admins write branding" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'branding' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins update branding" ON storage.objects;
CREATE POLICY "Admins update branding" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'branding' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins delete branding" ON storage.objects;
CREATE POLICY "Admins delete branding" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'branding' AND public.has_role(auth.uid(),'admin'));
