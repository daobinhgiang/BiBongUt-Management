-- Add creator timezone to tasks so due dates can be interpreted correctly across timezones.
-- "due_date" = the calendar day the task is due.
-- "creator_tz" = IANA timezone of the person who set the due date (e.g. "America/Los_Angeles").
-- The deadline moment = start of (due_date + 1 day) in creator_tz (i.e. midnight end-of-day).

ALTER TABLE public.tasks
  ADD COLUMN creator_tz text NOT NULL DEFAULT 'UTC';

-- Backfill: assume existing tasks were created in Vietnam time
UPDATE public.tasks SET creator_tz = 'Asia/Ho_Chi_Minh' WHERE creator_tz = 'UTC';

-- Change default for new rows to UTC (client will always send explicit timezone)
ALTER TABLE public.tasks ALTER COLUMN creator_tz SET DEFAULT 'UTC';
