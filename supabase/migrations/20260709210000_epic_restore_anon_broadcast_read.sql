-- EPIC repair 2026-07-09.
--
-- The 20260709202450 security migration REVOKEd anon SELECT on
-- public.broadcasts. That table is the EPIC lab announcement feed: the
-- student helper has NO auth flow and always reads as anon, so the revoke
-- silently killed announcements for every student (second regression of this
-- exact class; see 20260708203953 for the first).
--
-- DO NOT restrict EPIC tables (broadcasts, help_requests, group_progress,
-- group_completed, group_roster) to authenticated roles. The EPIC app is
-- intentionally anonymous; its tables hold no PII beyond first name + last
-- initial and are cohort/group scoped by policy instead.

GRANT SELECT ON public.broadcasts TO anon;
DROP POLICY IF EXISTS "authenticated_read" ON public.broadcasts;
DROP POLICY IF EXISTS "epic_broadcasts_read" ON public.broadcasts;
CREATE POLICY "epic_broadcasts_read" ON public.broadcasts
  FOR SELECT TO anon, authenticated USING (true);
