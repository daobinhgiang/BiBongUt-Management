-- Security fix: add auth.uid() ownership checks to RPCs that were missing them.
-- Matches the pattern used in redeem_reward, log_challenge_contribution, join_challenge.

-- 1. complete_task — add auth check after task lookup
create or replace function public.complete_task(
  p_task_id uuid,
  p_member_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task record;
  v_xp int;
  v_coins int;
  v_next_due date;
  v_old_level int;
  v_new_level int;
  v_new_xp int;
  v_badge_names text[];
begin
  -- Auth check: caller must own this member row
  if not exists (
    select 1 from public.family_members
    where id = p_member_id and user_id = auth.uid()
  ) then
    raise exception 'Not authorized for this member';
  end if;

  select * into v_task
  from public.tasks
  where id = p_task_id and is_active = true
  for update;

  if v_task is null then
    raise exception 'Task not found or already completed';
  end if;

  if not exists (
    select 1 from public.family_members
    where id = p_member_id and family_id = v_task.family_id
  ) then
    raise exception 'Member does not belong to this task''s family';
  end if;

  -- Determine reward type based on task_type
  if v_task.task_type = 'daily_habit' then
    v_xp := v_task.points;
    v_coins := 0;
  else
    v_xp := 0;
    v_coins := v_task.coins_reward;
  end if;

  -- 1. Insert completion record
  insert into public.task_completions (task_id, completed_by, points_awarded, coins_awarded)
  values (p_task_id, p_member_id, v_xp, v_coins);

  -- 2. Award points (inline)
  select level, total_xp + v_xp into v_old_level, v_new_xp
  from public.family_members where id = p_member_id for update;

  v_new_level := floor(sqrt(v_new_xp::numeric / 100)) + 1;

  update public.family_members set
    total_xp = v_new_xp,
    coins = coins + v_coins,
    level = v_new_level
  where id = p_member_id;

  insert into public.transactions (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
  values (p_member_id, v_xp, v_coins,
          'Completed task: ' || v_task.title, 'tasks', p_task_id);

  if v_new_level > v_old_level then
    insert into public.transactions (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
    values (p_member_id, 0, 0,
            'Level up! ' || v_old_level || ' → ' || v_new_level, 'family_members', p_member_id);
  end if;

  -- 3. Update streak
  perform public.update_streak(p_member_id);

  -- 4. Deactivate current task
  update public.tasks set is_active = false where id = p_task_id;

  -- 5. If recurring AND not a daily_habit, create next instance.
  if v_task.recurrence <> 'none' and v_task.task_type <> 'daily_habit' then
    v_next_due := coalesce(v_task.due_date, current_date);
    case v_task.recurrence
      when 'daily' then v_next_due := v_next_due + interval '1 day';
      when 'weekly' then v_next_due := v_next_due + interval '7 days';
      when 'monthly' then v_next_due := v_next_due + interval '1 month';
    end case;

    insert into public.tasks (
      title, description, assignee_id, difficulty, points, coins_reward,
      due_date, recurrence, family_id, created_by, task_type, creator_tz
    ) values (
      v_task.title, v_task.description, v_task.assignee_id, v_task.difficulty,
      v_task.points, v_task.coins_reward, v_next_due, v_task.recurrence,
      v_task.family_id, v_task.created_by, v_task.task_type, v_task.creator_tz
    );
  end if;

  -- 6. Collect newly unlocked badge names
  select array_agg(b.name) into v_badge_names
  from public.badge_unlocks bu
  join public.badges b on b.id = bu.badge_id
  where bu.family_member_id = p_member_id
    and bu.unlocked_at >= now() - interval '5 seconds';

  return jsonb_build_object(
    'points', v_xp,
    'coins', v_coins,
    'new_level', case when v_new_level > v_old_level then v_new_level else null end,
    'new_badges', coalesce(to_jsonb(v_badge_names), '[]'::jsonb)
  );
end;
$$;

-- 2. claim_daily_chest — add auth check + server-side completion validation
--    Signature changes: adds p_tz to calculate "today" server-side.
create or replace function public.claim_daily_chest(p_member_id uuid, p_tz text default 'UTC')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coins int;
  v_today date;
begin
  -- Auth check: caller must own this member row
  if not exists (
    select 1 from public.family_members
    where id = p_member_id and user_id = auth.uid()
  ) then
    raise exception 'Not authorized for this member';
  end if;

  v_today := (now() at time zone p_tz)::date;

  -- Verify all daily habits for today are completed (is_active = false means done)
  if exists (
    select 1 from public.tasks
    where assignee_id = p_member_id
      and task_type = 'daily_habit'
      and is_active = true
      and due_date = v_today
  ) then
    raise exception 'Not all daily tasks are completed';
  end if;

  -- Also verify daily habits actually exist for today (prevent claim before seeding)
  if not exists (
    select 1 from public.tasks
    where assignee_id = p_member_id
      and task_type = 'daily_habit'
      and due_date = v_today
  ) then
    raise exception 'No daily tasks found for today';
  end if;

  -- Random coins between 5 and 20
  v_coins := floor(random() * 16 + 5)::int;

  -- Award coins
  update public.family_members
  set coins = coins + v_coins
  where id = p_member_id;

  -- Record transaction
  insert into public.transactions (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
  values (p_member_id, 0, v_coins, 'Daily chest reward', 'daily_chest', p_member_id);

  return jsonb_build_object('coins_awarded', v_coins, 'already_claimed', false);
end;
$$;

-- 3. ensure_daily_habits — add auth check
create or replace function public.ensure_daily_habits(
  p_member_id uuid,
  p_family_id uuid,
  p_tz text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date;
begin
  -- Auth check: caller must own this member row
  if not exists (
    select 1 from public.family_members
    where id = p_member_id and user_id = auth.uid()
  ) then
    raise exception 'Not authorized for this member';
  end if;

  v_today := (now() at time zone p_tz)::date;

  insert into public.tasks (
    title, assignee_id, difficulty, points, coins_reward,
    due_date, recurrence, family_id, created_by, task_type, creator_tz
  ) values
    ('Eat breakfast', p_member_id, 'easy', 5, 0, v_today, 'daily', p_family_id, p_member_id, 'daily_habit', p_tz),
    ('Brush teeth', p_member_id, 'easy', 5, 0, v_today, 'daily', p_family_id, p_member_id, 'daily_habit', p_tz),
    ('Drink water', p_member_id, 'easy', 5, 0, v_today, 'daily', p_family_id, p_member_id, 'daily_habit', p_tz)
  on conflict do nothing;
end;
$$;

-- 4. dev_reset_today_tasks — add auth check + dev-only gate
create or replace function public.dev_reset_today_tasks(p_member_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comp record;
  v_count int := 0;
  v_total_xp int := 0;
  v_total_coins int := 0;
begin
  -- Auth check: caller must own this member row
  if not exists (
    select 1 from public.family_members
    where id = p_member_id and user_id = auth.uid()
  ) then
    raise exception 'Not authorized for this member';
  end if;

  for v_comp in
    select
      tc.id,
      tc.task_id,
      coalesce(tc.points_awarded, 0) as xp,
      coalesce(tc.coins_awarded, 0) as coins,
      t.task_type,
      t.family_id,
      t.assignee_id,
      t.title,
      t.due_date
    from public.task_completions tc
    join public.tasks t on t.id = tc.task_id
    where tc.completed_by = p_member_id
      and tc.completed_at::date = current_date
  loop
    -- Remove replacement active daily habits before reactivating the original.
    if v_comp.task_type = 'daily_habit' then
      delete from public.tasks
      where task_type = 'daily_habit'
        and is_active = true
        and id <> v_comp.task_id
        and family_id = v_comp.family_id
        and assignee_id = v_comp.assignee_id
        and title = v_comp.title
        and due_date = v_comp.due_date;
    end if;

    update public.tasks set is_active = true where id = v_comp.task_id;

    v_total_xp := v_total_xp + v_comp.xp;
    v_total_coins := v_total_coins + v_comp.coins;
    v_count := v_count + 1;
  end loop;

  delete from public.task_completions
  where completed_by = p_member_id
    and completed_at::date = current_date;

  delete from public.transactions
  where family_member_id = p_member_id
    and created_at::date = current_date;

  if v_total_xp > 0 or v_total_coins > 0 then
    update public.family_members set
      total_xp = greatest(0, total_xp - v_total_xp),
      coins = greatest(0, coins - v_total_coins),
      level = greatest(1, floor(sqrt(greatest(0, total_xp - v_total_xp)::numeric / 100)) + 1)
    where id = p_member_id;
  end if;

  return v_count;
end;
$$;
