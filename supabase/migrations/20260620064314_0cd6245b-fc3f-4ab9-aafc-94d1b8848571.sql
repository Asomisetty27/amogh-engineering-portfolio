CREATE TABLE public.broadcasts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort text NOT NULL DEFAULT 'week1',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.broadcasts TO anon, authenticated;
GRANT ALL ON public.broadcasts TO service_role;

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY epic_broadcasts_read ON public.broadcasts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY epic_broadcasts_insert ON public.broadcasts FOR INSERT TO anon, authenticated WITH CHECK (true);

ALTER TABLE public.broadcasts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;