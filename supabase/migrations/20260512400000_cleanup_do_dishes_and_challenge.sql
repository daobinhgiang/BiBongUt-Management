-- One-off data cleanup: remove "Do the dishes" task link and the "Clean House Dragon" challenge.
-- Challenge ID: 3fdbbe1d-e5ea-48df-a102-d4419e74b378 (from browser URL)
-- Task ID: f6c5f381-2e11-4798-bc75-78b598e68983 (from console log)

-- 1. Remove the challenge_tasks link for "Do the dishes"
DELETE FROM public.challenge_tasks
WHERE task_id = 'f6c5f381-2e11-4798-bc75-78b598e68983';

-- 2. Delete the task itself
DELETE FROM public.task_completions WHERE task_id = 'f6c5f381-2e11-4798-bc75-78b598e68983';
DELETE FROM public.tasks WHERE id = 'f6c5f381-2e11-4798-bc75-78b598e68983';

-- 3. Delete the entire "Clean House Dragon" challenge (cascade handles participants, logs, challenge_tasks)
DELETE FROM public.challenge_logs
WHERE challenge_id = '3fdbbe1d-e5ea-48df-a102-d4419e74b378';
DELETE FROM public.challenge_participants
WHERE challenge_id = '3fdbbe1d-e5ea-48df-a102-d4419e74b378';
DELETE FROM public.challenge_tasks
WHERE challenge_id = '3fdbbe1d-e5ea-48df-a102-d4419e74b378';
DELETE FROM public.challenges
WHERE id = '3fdbbe1d-e5ea-48df-a102-d4419e74b378';
