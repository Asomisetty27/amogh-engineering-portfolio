-- ═══════════════════════════════════════════════════════════════════════
-- EPIC REPAIR - 2026-07-09 - needs ONE manual run against production.
-- Paste this whole file into the Supabase SQL editor (project
-- vpbwmcfzeuqisgwwtchd) and run it, or tell Claude "apply the EPIC SQL"
-- outside auto mode. Safe to run twice: everything is IF EXISTS / IF NOT
-- EXISTS guarded.
--
-- Why: (1) migration 20260708203953 (group_completed table + cohort policy
-- fixes) was committed to the repo but never applied to prod, so instructor
-- checkoffs write into a missing table and student progress can't restore;
-- (2) the 20260709 security sweep revoked anon SELECT on broadcasts, killing
-- announcements for students (the EPIC app has no auth - students are anon).
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Cohort-scoped policies (from 20260708203953)
DROP POLICY IF EXISTS "epic_broadcasts_insert" ON public.broadcasts;
CREATE POLICY "epic_broadcasts_insert" ON public.broadcasts
  FOR INSERT TO anon, authenticated
  WITH CHECK (cohort = ANY (ARRAY['week1','week2','week3','week4']));

DROP POLICY IF EXISTS "epic_help_insert" ON public.help_requests;
CREATE POLICY "epic_help_insert" ON public.help_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (cohort = ANY (ARRAY['week1','week2','week3','week4']) AND group_no BETWEEN 1 AND 50);

DROP POLICY IF EXISTS "epic_help_update" ON public.help_requests;
CREATE POLICY "epic_help_update" ON public.help_requests
  FOR UPDATE TO anon, authenticated
  USING (cohort = ANY (ARRAY['week1','week2','week3','week4']))
  WITH CHECK (cohort = ANY (ARRAY['week1','week2','week3','week4']) AND group_no BETWEEN 1 AND 50);

DROP POLICY IF EXISTS "epic_prog_insert" ON public.group_progress;
CREATE POLICY "epic_prog_insert" ON public.group_progress
  FOR INSERT TO anon, authenticated
  WITH CHECK (cohort = ANY (ARRAY['week1','week2','week3','week4']) AND group_no BETWEEN 1 AND 50);

DROP POLICY IF EXISTS "epic_prog_update" ON public.group_progress;
CREATE POLICY "epic_prog_update" ON public.group_progress
  FOR UPDATE TO anon, authenticated
  USING (cohort = ANY (ARRAY['week1','week2','week3','week4']))
  WITH CHECK (cohort = ANY (ARRAY['week1','week2','week3','week4']) AND group_no BETWEEN 1 AND 50);

-- 2. group_completed: instructor checkoff + student progress restore
CREATE TABLE IF NOT EXISTS public.group_completed (
  cohort text NOT NULL,
  group_no int NOT NULL,
  activity_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cohort, group_no, activity_id)
);
GRANT SELECT, INSERT, DELETE ON public.group_completed TO anon, authenticated;
GRANT ALL ON public.group_completed TO service_role;
ALTER TABLE public.group_completed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "epic_completed_read" ON public.group_completed;
CREATE POLICY "epic_completed_read" ON public.group_completed
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "epic_completed_insert" ON public.group_completed;
CREATE POLICY "epic_completed_insert" ON public.group_completed
  FOR INSERT TO anon, authenticated
  WITH CHECK (cohort = ANY (ARRAY['week1','week2','week3','week4']) AND group_no BETWEEN 1 AND 50);
DROP POLICY IF EXISTS "epic_completed_delete" ON public.group_completed;
CREATE POLICY "epic_completed_delete" ON public.group_completed
  FOR DELETE TO anon, authenticated
  USING (cohort = ANY (ARRAY['week1','week2','week3','week4']));

ALTER TABLE public.group_completed REPLICA IDENTITY FULL;
-- Realtime publication add errors harmlessly if already present; run alone
-- and ignore "already member" if it fires:
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_completed;

-- 3. Restore anon read on broadcasts (undo the 20260709 sweep for this table)
GRANT SELECT ON public.broadcasts TO anon;
DROP POLICY IF EXISTS "authenticated_read" ON public.broadcasts;
DROP POLICY IF EXISTS "epic_broadcasts_read" ON public.broadcasts;
CREATE POLICY "epic_broadcasts_read" ON public.broadcasts
  FOR SELECT TO anon, authenticated USING (true);
