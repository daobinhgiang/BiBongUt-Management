-- award_points() integration test
-- Run against a local Supabase instance as superuser (bypasses RLS and FK
-- checks to auth.users, since test UUIDs don't exist in auth.users):
--   psql "$DATABASE_URL" -f supabase/tests/award_points_test.sql

begin;

-- 1. Setup: create a test family and member
insert into families (id, name, created_by)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Test Family', 'bbbbbbbb-0000-0000-0000-000000000001');

insert into family_members (id, family_id, user_id, role, nickname, total_xp, coins, level)
values (
  'cccccccc-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'parent',
  'TestParent',
  0, 0, 1
);

-- 2. Call award_points and verify XP/coins updated
select award_points(
  'cccccccc-0000-0000-0000-000000000001',
  50, 10, 'test_award', 'tasks', 'dddddddd-0000-0000-0000-000000000001'
);

do $$
declare
  v_xp int;
  v_coins int;
  v_level int;
  v_tx_count int;
begin
  select total_xp, coins, level into v_xp, v_coins, v_level
  from family_members where id = 'cccccccc-0000-0000-0000-000000000001';

  assert v_xp = 50, 'Expected total_xp=50, got ' || v_xp;
  assert v_coins = 10, 'Expected coins=10, got ' || v_coins;
  assert v_level = 1, 'Expected level=1, got ' || v_level;

  -- Verify transaction was created
  select count(*) into v_tx_count
  from transactions where family_member_id = 'cccccccc-0000-0000-0000-000000000001';
  assert v_tx_count = 1, 'Expected 1 transaction, got ' || v_tx_count;
end $$;

-- 3. Award enough XP to trigger a level-up (level 2 at 100 XP)
select award_points(
  'cccccccc-0000-0000-0000-000000000001',
  60, 5, 'level_up_trigger', 'tasks', 'dddddddd-0000-0000-0000-000000000002'
);

do $$
declare
  v_xp int;
  v_coins int;
  v_level int;
  v_tx_count int;
  v_levelup_count int;
begin
  select total_xp, coins, level into v_xp, v_coins, v_level
  from family_members where id = 'cccccccc-0000-0000-0000-000000000001';

  assert v_xp = 110, 'Expected total_xp=110, got ' || v_xp;
  assert v_coins = 15, 'Expected coins=15, got ' || v_coins;
  assert v_level = 2, 'Expected level=2, got ' || v_level;

  -- Verify level_up transaction was created
  select count(*) into v_levelup_count
  from transactions
  where family_member_id = 'cccccccc-0000-0000-0000-000000000001'
    and reason like 'level_up:%';
  assert v_levelup_count = 1, 'Expected 1 level_up transaction, got ' || v_levelup_count;
end $$;

-- Rollback so test is idempotent
rollback;

-- All assertions passed
select 'award_points_test: ALL PASSED' as result;
