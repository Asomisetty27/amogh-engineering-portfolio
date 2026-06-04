
-- 1) advisor_questions: restrict SELECT to authenticated only
DROP POLICY IF EXISTS public_read ON public.advisor_questions;
REVOKE SELECT ON public.advisor_questions FROM anon;
GRANT SELECT ON public.advisor_questions TO authenticated;
CREATE POLICY authenticated_read ON public.advisor_questions
  FOR SELECT TO authenticated USING (true);

-- 2) advisor_allowlist: remove broad authenticated read; expose membership via SECURITY DEFINER function
DROP POLICY IF EXISTS authenticated_read ON public.advisor_allowlist;
REVOKE SELECT ON public.advisor_allowlist FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.is_advisor_allowlisted(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.advisor_allowlist WHERE email = _email);
$$;

GRANT EXECUTE ON FUNCTION public.is_advisor_allowlisted(text) TO authenticated, service_role;
