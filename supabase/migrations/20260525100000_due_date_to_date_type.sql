-- Migration: Change tasks.due_date from timestamptz to date
-- A due date represents a calendar day, not a point in time.
-- This fixes the filter mismatch where the client compares "2026-05-25" (local date)
-- against "2026-05-25T00:00:00+00:00" (timestamptz from DB) — which never matches.

-- 1. Convert column from timestamptz to date (extracts the date portion)
ALTER TABLE public.tasks
  ALTER COLUMN due_date TYPE date USING due_date::date;

-- 2. Drop and recreate the unique index (same logic, now on date type)
DROP INDEX IF EXISTS public.tasks_chart_date_unique;
CREATE UNIQUE INDEX tasks_chart_date_unique
  ON public.tasks (source_chart_id, due_date)
  WHERE source_chart_id IS NOT NULL;
