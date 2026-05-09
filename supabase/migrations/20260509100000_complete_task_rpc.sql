-- Atomic complete_task RPC: inserts completion, awards points, deactivates task,
-- and optionally creates the next recurring instance — all in one transaction.
-- SECURITY DEFINER so children can call it (award_points requires parent role).
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
  v_next_due date;
begin
  -- Lock and fetch the task
  select * into v_task
  from public.tasks
  where id = p_task_id and is_active = true
  for update;

  if v_task is null then
    raise exception 'Task not found or already completed';
  end if;

  -- Verify the member belongs to the same family
  if not exists (
    select 1 from public.family_members
    where id = p_member_id and family_id = v_task.family_id
  ) then
    raise exception 'Member does not belong to this task''s family';
  end if;

  -- 1. Insert completion record
  insert into public.task_completions (task_id, completed_by, points_awarded, coins_awarded)
  values (p_task_id, p_member_id, v_task.points, v_task.coins_reward);

  -- 2. Award points (inline to bypass parent-role check in award_points)
  declare
    v_old_level int;
    v_new_level int;
    v_new_xp int;
  begin
    select level, total_xp + v_task.points into v_old_level, v_new_xp
    from public.family_members where id = p_member_id for update;

    v_new_level := floor(sqrt(v_new_xp::numeric / 100)) + 1;

    update public.family_members set
      total_xp = v_new_xp,
      coins = coins + v_task.coins_reward,
      level = v_new_level
    where id = p_member_id;

    insert into public.transactions (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
    values (p_member_id, v_task.points, v_task.coins_reward,
            'Completed task: ' || v_task.title, 'tasks', p_task_id);

    if v_new_level > v_old_level then
      insert into public.transactions (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
      values (p_member_id, 0, 0,
              'Level up! ' || v_old_level || ' → ' || v_new_level, 'family_members', p_member_id);
    end if;
  end;

  -- 3. Deactivate current task
  update public.tasks set is_active = false where id = p_task_id;

  -- 4. If recurring, create next instance
  if v_task.recurrence <> 'none' then
    -- Default to today if no due date set
    v_next_due := coalesce(v_task.due_date, current_date);
    case v_task.recurrence
      when 'daily' then v_next_due := v_next_due + interval '1 day';
      when 'weekly' then v_next_due := v_next_due + interval '7 days';
      when 'monthly' then v_next_due := v_next_due + interval '1 month';
    end case;

    insert into public.tasks (
      title, description, assignee_id, difficulty, points, coins_reward,
      due_date, recurrence, family_id, created_by
    ) values (
      v_task.title, v_task.description, v_task.assignee_id, v_task.difficulty,
      v_task.points, v_task.coins_reward, v_next_due, v_task.recurrence,
      v_task.family_id, v_task.created_by
    );
  end if;

  return jsonb_build_object('points', v_task.points, 'coins', v_task.coins_reward);
end;
$$;
