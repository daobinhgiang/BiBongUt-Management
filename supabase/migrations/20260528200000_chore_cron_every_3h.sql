-- =============================================================================
-- Run chore task generation every 3 hours instead of once daily at 00:05 UTC.
-- This covers all timezones — ON CONFLICT DO NOTHING prevents duplicates.
-- Also remove client-side sync dependency by making this the sole source of truth.
-- =============================================================================

-- Unschedule the old daily cron
SELECT cron.unschedule('generate-chore-tasks');

-- Schedule every 3 hours (00:05, 03:05, 06:05, ... 21:05 UTC)
SELECT cron.schedule(
  'generate-chore-tasks',
  '5 */3 * * *',
  $$SELECT public.generate_chore_tasks()$$
);
