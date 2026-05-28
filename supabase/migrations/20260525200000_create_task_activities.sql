-- task_activities: stores per-family activity names for autocomplete
CREATE TABLE IF NOT EXISTS public.task_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name text NOT NULL,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (family_id, name)
);

ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_task_activities_recency ON public.task_activities (family_id, last_used_at DESC);

DO $$ BEGIN
  CREATE POLICY "Members can view family activities" ON public.task_activities FOR SELECT
    USING (family_id IN (SELECT my_family_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Members can insert activities" ON public.task_activities FOR INSERT
    WITH CHECK (family_id IN (SELECT my_family_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Members can update activities" ON public.task_activities FOR UPDATE
    USING (family_id IN (SELECT my_family_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
