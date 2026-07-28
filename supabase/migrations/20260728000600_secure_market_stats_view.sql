BEGIN;

ALTER VIEW public.route_market_stats
  SET (security_invoker = true);

REVOKE ALL ON TABLE public.route_market_stats FROM anon, authenticated;

COMMIT;
