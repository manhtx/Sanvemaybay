BEGIN;

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-only access to price history" ON public.price_history;
CREATE POLICY "Allow public read-only access to price history"
  ON public.price_history FOR SELECT
  USING (true);

COMMIT;
