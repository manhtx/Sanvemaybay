BEGIN;

CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, deal_id)
);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can manage their own bookmarks"
  ON public.user_bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;
