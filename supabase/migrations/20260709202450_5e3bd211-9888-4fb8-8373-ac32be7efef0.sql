-- advisor_asks: restrict SELECT to allowlisted advisors
DROP POLICY IF EXISTS "authenticated_read" ON public.advisor_asks;
DROP POLICY IF EXISTS "public_read" ON public.advisor_asks;
CREATE POLICY "allowlisted_read" ON public.advisor_asks
  FOR SELECT TO authenticated
  USING (public.is_current_user_allowlisted());

-- advisor_questions: restrict SELECT to allowlisted advisors
DROP POLICY IF EXISTS "authenticated_read" ON public.advisor_questions;
DROP POLICY IF EXISTS "public_read" ON public.advisor_questions;
CREATE POLICY "allowlisted_read" ON public.advisor_questions
  FOR SELECT TO authenticated
  USING (public.is_current_user_allowlisted());

-- decision_log: restrict SELECT to allowlisted advisors
DROP POLICY IF EXISTS "authenticated_read" ON public.decision_log;
DROP POLICY IF EXISTS "public_read" ON public.decision_log;
CREATE POLICY "allowlisted_read" ON public.decision_log
  FOR SELECT TO authenticated
  USING (public.is_current_user_allowlisted());

-- broadcasts: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "public_read" ON public.broadcasts;
DROP POLICY IF EXISTS "Broadcasts are viewable by everyone" ON public.broadcasts;
REVOKE SELECT ON public.broadcasts FROM anon;
CREATE POLICY "authenticated_read" ON public.broadcasts
  FOR SELECT TO authenticated
  USING (true);

-- lab_help_requests: restrict INSERT and SELECT to authenticated users
DROP POLICY IF EXISTS "lab_help_read" ON public.lab_help_requests;
DROP POLICY IF EXISTS "lab_help_insert" ON public.lab_help_requests;
REVOKE SELECT, INSERT ON public.lab_help_requests FROM anon;
CREATE POLICY "lab_help_read_auth" ON public.lab_help_requests
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "lab_help_insert_auth" ON public.lab_help_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    group_no > 0
    AND kind IN ('help','check','done','stuck','question','urgent')
  );
