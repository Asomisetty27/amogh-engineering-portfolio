
DROP FUNCTION IF EXISTS public.is_advisor_allowlisted(text);

CREATE OR REPLACE FUNCTION public.is_current_user_allowlisted()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.advisor_allowlist
    WHERE email = auth.email()
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_allowlisted() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_allowlisted() TO authenticated, service_role;
