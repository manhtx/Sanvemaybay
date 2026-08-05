BEGIN;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public, pg_temp;

DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
  END IF;
END;
$$;

COMMIT;
