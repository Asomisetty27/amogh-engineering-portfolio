
CREATE TABLE public.help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort text NOT NULL DEFAULT 'week1',
  group_no int NOT NULL,
  type text NOT NULL,
  activity text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX help_requests_cohort_status_idx ON public.help_requests (cohort, status, created_at);

CREATE TABLE public.group_progress (
  cohort text NOT NULL DEFAULT 'week1',
  group_no int NOT NULL,
  activity text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cohort, group_no)
);

GRANT SELECT, INSERT, UPDATE ON public.help_requests TO anon, authenticated;
GRANT ALL ON public.help_requests TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.group_progress TO anon, authenticated;
GRANT ALL ON public.group_progress TO service_role;

ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "epic_help_read"   ON public.help_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "epic_help_insert" ON public.help_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "epic_help_update" ON public.help_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "epic_prog_read"   ON public.group_progress FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "epic_prog_insert" ON public.group_progress FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "epic_prog_update" ON public.group_progress FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.help_requests REPLICA IDENTITY FULL;
ALTER TABLE public.group_progress REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.help_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_progress;
