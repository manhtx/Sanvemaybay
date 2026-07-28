BEGIN;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;

COMMIT;
