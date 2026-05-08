-- Seed script for BiBongUt Family Management App
-- Uses service_role context (bypasses RLS) for seeding

-- Create test family
insert into public.families (id, name, created_by)
values (
  '00000000-0000-0000-0000-000000000001',
  'Dao Family',
  '00000000-0000-0000-0000-aaaaaaaaaaaa' -- placeholder auth user id
);

-- Create parent member
insert into public.family_members (id, family_id, user_id, role, nickname)
values (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-aaaaaaaaaaaa',
  'parent',
  'Dad'
);

-- Create child member
insert into public.family_members (id, family_id, user_id, role, nickname, birthdate)
values (
  '00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-bbbbbbbbbbbb',
  'child',
  'Kiddo',
  '2018-06-15'
);

-- Create tasks (easy, medium, hard)
insert into public.tasks (id, family_id, title, difficulty, points, coins_reward, created_by) values
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'Make your bed', 'easy', 5, 1, '00000000-0000-0000-0001-000000000001'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', 'Do homework', 'medium', 15, 2, '00000000-0000-0000-0001-000000000001'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', 'Clean the garage', 'hard', 30, 5, '00000000-0000-0000-0001-000000000001');

-- Create a sample badge
insert into public.badges (id, code, name, description, xp_reward, coins_reward, criteria)
values (
  '00000000-0000-0000-0003-000000000001',
  'first_task',
  'First Task',
  'Complete your first task',
  10,
  5,
  '{"type": "task_completions", "count": 1}'::jsonb
);

-- Create a sample reward
insert into public.rewards (id, family_id, title, description, cost_coins, created_by)
values (
  '00000000-0000-0000-0004-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Extra Screen Time (30 min)',
  'Earn 30 minutes of extra screen time',
  10,
  '00000000-0000-0000-0001-000000000001'
);

-- Test award_points: give the child 50 XP and 5 coins for completing a task
select public.award_points(
  '00000000-0000-0000-0001-000000000002',
  50, 5,
  'task_complete', 'tasks', '00000000-0000-0000-0002-000000000001'
);

-- Verify: child should now have 50 XP, 5 coins, level 1
-- (level stays at 1 because floor(sqrt(50/100))+1 = 1)
