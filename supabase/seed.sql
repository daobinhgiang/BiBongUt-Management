-- Seed script for BiBongUt Family Management App
-- Runs with service_role (bypasses RLS) via `supabase db reset`

-- Create test auth users (required for FK references)
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
values
  (
    '00000000-0000-0000-0000-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'parent@test.com',
    crypt('password123', gen_salt('bf')),
    now(), now(), now(), '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'child@test.com',
    crypt('password123', gen_salt('bf')),
    now(), now(), now(), '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  );

-- Create identities for the test users (required for email login)
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
values
  (
    '00000000-0000-0000-0000-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-aaaaaaaaaaaa',
    'parent@test.com', 'email',
    '{"sub":"00000000-0000-0000-0000-aaaaaaaaaaaa","email":"parent@test.com"}'::jsonb,
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-bbbbbbbbbbbb',
    'child@test.com', 'email',
    '{"sub":"00000000-0000-0000-0000-bbbbbbbbbbbb","email":"child@test.com"}'::jsonb,
    now(), now(), now()
  );

-- Create test family
insert into public.families (id, name, created_by)
values (
  '00000000-0000-0000-0000-000000000001',
  'Dao Family',
  '00000000-0000-0000-0000-aaaaaaaaaaaa'
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
