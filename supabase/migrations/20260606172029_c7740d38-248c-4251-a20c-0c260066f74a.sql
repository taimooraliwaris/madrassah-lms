DROP POLICY IF EXISTS "Operators read own remarks_entries" ON public.remarks_entries;
CREATE POLICY "Operators read own remarks_entries"
ON public.remarks_entries
FOR SELECT
TO authenticated
USING (submitted_by = auth.uid() AND public.has_role(auth.uid(), 'operator'::public.app_role));