-- ============================================================
-- Enable pg_cron and pg_net (required for scheduled edge function calls)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable the extensions (Supabase already has these available)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- Schedule sftp-poll to run every 24 hours at 6 AM UTC (2 AM ET / 11 PM PT)
-- This is the backup cron — the primary trigger is the SFTPCloud webhook
-- ============================================================
SELECT cron.schedule(
  'sftp-daily-poll',                    -- job name
  '0 6 * * *',                          -- every day at 6:00 AM UTC
  $$
  SELECT net.http_get(
    url := 'https://jfyfbjybbbsiovihrpal.supabase.co/functions/v1/sftp-poll',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- ============================================================
-- View scheduled jobs (for verification)
-- ============================================================
-- SELECT * FROM cron.job;

-- ============================================================
-- To delete the cron job later:
-- SELECT cron.unschedule('sftp-daily-poll');
-- ============================================================
