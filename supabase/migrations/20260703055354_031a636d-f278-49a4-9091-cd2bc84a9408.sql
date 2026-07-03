CREATE TABLE public.lab_help_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_no integer NOT NULL,
    kind text NOT NULL CHECK (kind IN ('wiring', 'stuck', 'checkoff')),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_help_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_help_requests TO authenticated;
GRANT ALL ON public.lab_help_requests TO service_role;

ALTER TABLE public.lab_help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for anon and authenticated"
ON public.lab_help_requests
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

ALTER TABLE public.lab_help_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_help_requests;