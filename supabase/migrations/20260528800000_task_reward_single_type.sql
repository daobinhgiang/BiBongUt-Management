-- Simplify task rewards: daily tasks = XP only, regular tasks = coins only.
-- The RPC handles the logic at completion time; no data migration needed.

-- 1. Update complete_task to conditionally award one reward type
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

-- 2. Update ensure_daily_habits to seed coins_reward=0 (daily tasks give XP only)
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
