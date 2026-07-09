-- EPIC 2026 - group roster (first name + last initial ONLY; minors' data).
-- Stores who is in each group per cohort so the instructor dashboard can show
-- names instead of bare group numbers. PRIVACY: never full names, emails, or
-- any other PII - the StudentHelper inputs enforce "Maya R." style entries.

CREATE TABLE public.group_roster (
  cohort text NOT NULL DEFAULT 'week1',
  group_no int NOT NULL,
  members text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cohort, group_no)
);

GRANT SELECT, INSERT, UPDATE ON public.group_roster TO anon, authenticated;
GRANT ALL ON public.group_roster TO service_role;

ALTER TABLE public.group_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "epic_roster_read"   ON public.group_roster FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "epic_roster_insert" ON public.group_roster FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "epic_roster_update" ON public.group_roster FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.group_roster REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_roster;
