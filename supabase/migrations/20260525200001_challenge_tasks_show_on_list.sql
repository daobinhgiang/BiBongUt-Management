-- Add show_on_task_list flag to challenge_tasks
ALTER TABLE public.challenge_tasks ADD COLUMN IF NOT EXISTS show_on_task_list boolean NOT NULL DEFAULT false;
