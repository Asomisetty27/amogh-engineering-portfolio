-- EPIC 2026 fixes:
--
-- 1. "Announcements don't work": the 2026-06-24 hardening migration switched
--    epic_broadcasts_insert to `TO authenticated WITH CHECK
--    (is_current_user_allowlisted())`. That policy was written for the
--    ThermalOS Advisor feature's auth model, but the EPIC InstructorDashboard
--    has no login flow at all -- it always writes as `anon`. Every broadcast
--    insert has therefore been silently rejected by RLS since that migration.
--    Restore anon/authenticated insert, scoped to a real cohort + group range
--    (matching the pattern already used for help_requests/group_progress)
--    instead of reopening it unscoped.
--
-- 2. "Queue doesn't update without a manual refresh": a secondary bug in the
--    same hardening migration hardcoded `cohort = 'week1'` on the
--    help_requests/group_progress INSERT+UPDATE policies. cohort.ts defines
--    FOUR active cohorts (week1..week4). Any session running week2/3/4 has
--    had every help-request insert and progress upsert rejected by RLS,
--    which looks exactly like "the queue never updates" from the dashboard.
--    Broaden the check to all four cohorts.
--
-- 3. New group_completed table: per-activity completion, written when a
--    student's check-off is approved AND directly editable by the instructor
--    from the dashboard, so a group's progress can be restored after a lost
--    device/cleared localStorage without replaying every step live.

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

-- ── group_completed: per-activity completion record, editable by both the
--    normal student check-off flow and the instructor dashboard.
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

CREATE POLICY "epic_completed_read" ON public.group_completed
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "epic_completed_insert" ON public.group_completed
  FOR INSERT TO anon, authenticated
  WITH CHECK (cohort = ANY (ARRAY['week1','week2','week3','week4']) AND group_no BETWEEN 1 AND 50);
CREATE POLICY "epic_completed_delete" ON public.group_completed
  FOR DELETE TO anon, authenticated
  USING (cohort = ANY (ARRAY['week1','week2','week3','week4']));

ALTER TABLE public.group_completed REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_completed;
