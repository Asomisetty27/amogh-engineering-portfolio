DROP POLICY IF EXISTS public_read ON public.advisor_allowlist;
REVOKE SELECT ON public.advisor_allowlist FROM anon;
CREATE POLICY "authenticated_read" ON public.advisor_allowlist FOR SELECT TO authenticated USING (true);