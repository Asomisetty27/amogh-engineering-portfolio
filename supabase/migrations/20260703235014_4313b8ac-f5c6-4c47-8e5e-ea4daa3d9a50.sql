-- advisor_asks: restrict SELECT to authenticated users
DROP POLICY IF EXISTS public_read ON public.advisor_asks;
REVOKE SELECT ON public.advisor_asks FROM anon;
GRANT SELECT ON public.advisor_asks TO authenticated;
CREATE POLICY "authenticated_read" ON public.advisor_asks
  FOR SELECT TO authenticated USING (true);

-- decision_log: restrict SELECT to authenticated users
DROP POLICY IF EXISTS public_read ON public.decision_log;
REVOKE SELECT ON public.decision_log FROM anon;
GRANT SELECT ON public.decision_log TO authenticated;
CREATE POLICY "authenticated_read" ON public.decision_log
  FOR SELECT TO authenticated USING (true);

-- lab_help_requests: keep SELECT/INSERT open for external app, remove UPDATE/DELETE ability
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated" ON public.lab_help_requests;
CREATE POLICY "lab_help_read" ON public.lab_help_requests
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "lab_help_insert" ON public.lab_help_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (kind IN ('wiring','stuck','checkoff') AND group_no >= 1);
-- No UPDATE/DELETE policies => denied for anon/authenticated. service_role bypasses RLS.
