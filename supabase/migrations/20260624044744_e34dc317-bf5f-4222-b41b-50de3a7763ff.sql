-- 1. Harden advisor_questions UPDATE: use SECURITY DEFINER helper instead of
--    a subquery against advisor_allowlist (avoids any direct table access path).
DROP POLICY IF EXISTS "advisor_update" ON public.advisor_questions;
CREATE POLICY "advisor_update" ON public.advisor_questions
  FOR UPDATE TO authenticated
  USING (public.is_current_user_allowlisted())
  WITH CHECK (public.is_current_user_allowlisted());

-- 2. Restrict broadcasts INSERT to allowlisted advisors only (was anon WITH CHECK true)
DROP POLICY IF EXISTS "epic_broadcasts_insert" ON public.broadcasts;
CREATE POLICY "epic_broadcasts_insert" ON public.broadcasts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_allowlisted());

-- 3. Tighten always-true permissive policies on classroom tables.
--    Keep anon writes (the EPIC student helper has no login), but constrain
--    every insert/update to the active cohort + a valid group number.
DROP POLICY IF EXISTS "epic_help_insert" ON public.help_requests;
CREATE POLICY "epic_help_insert" ON public.help_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (cohort = 'week1' AND group_no BETWEEN 1 AND 50);

DROP POLICY IF EXISTS "epic_help_update" ON public.help_requests;
CREATE POLICY "epic_help_update" ON public.help_requests
  FOR UPDATE TO anon, authenticated
  USING (cohort = 'week1')
  WITH CHECK (cohort = 'week1' AND group_no BETWEEN 1 AND 50);

DROP POLICY IF EXISTS "epic_prog_insert" ON public.group_progress;
CREATE POLICY "epic_prog_insert" ON public.group_progress
  FOR INSERT TO anon, authenticated
  WITH CHECK (cohort = 'week1' AND group_no BETWEEN 1 AND 50);

DROP POLICY IF EXISTS "epic_prog_update" ON public.group_progress;
CREATE POLICY "epic_prog_update" ON public.group_progress
  FOR UPDATE TO anon, authenticated
  USING (cohort = 'week1')
  WITH CHECK (cohort = 'week1' AND group_no BETWEEN 1 AND 50);