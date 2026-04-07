-- Setup pg_cron to call edge function every 12 hours

-- Ensure pg_net and pg_cron extensions are enabled (requires superuser, depends on Supabase project setup)
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job
SELECT cron.schedule(
  'auto-scan-flights-12h', -- job name
  '0 */12 * * *',          -- cron schedule (every 12 hours)
  $$
    SELECT net.http_post(
      url:='https://your-project-ref.supabase.co/functions/v1/flight-scanner',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    )
  $$
);
