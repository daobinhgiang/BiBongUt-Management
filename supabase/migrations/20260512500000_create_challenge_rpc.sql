-- Atomic create_challenge RPC: creates challenge, adds participants, creates tasks, links them.
-- SECURITY DEFINER so any family member can create a challenge and add participants.
create or replace function public.create_challenge(
  p_family_id uuid,
  p_created_by uuid,
  p_title text,
  p_boss_name text,
  p_boss_emoji text,
  p_template_id text,
  p_reward_xp int,
  p_reward_coins int,
  p_end_date timestamptz default null,
  p_participant_ids uuid[] default '{}',
  p_tasks jsonb default '[]'
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_challenge_id uuid;
  v_task_rec jsonb;
  v_task_id uuid;
  v_total_damage int := 0;
  v_pid uuid;
  v_points int;
  v_coins int;
begin
  -- Auth check: caller must own the created_by member row
  if not exists (
    select 1 from public.family_members
    where id = p_created_by and user_id = auth.uid() and family_id = p_family_id
  ) then
    raise exception 'Not authorized';
  end if;

  -- Calculate total damage from tasks
  for v_task_rec in select * from jsonb_array_elements(p_tasks)
  loop
    v_total_damage := v_total_damage + (v_task_rec->>'damage')::int;
  end loop;

  -- 1. Insert the challenge
  insert into public.challenges (
    family_id, created_by, title, type, status,
    boss_name, boss_emoji, template_id,
    target_value, reward_xp, reward_coins, end_date
  ) values (
    p_family_id, p_created_by, p_title, 'boss_battle', 'active',
    p_boss_name, p_boss_emoji, p_template_id,
    v_total_damage, p_reward_xp, p_reward_coins, p_end_date
  ) returning id into v_challenge_id;

  -- 2. Add participants (creator + selected)
  foreach v_pid in array p_participant_ids
  loop
    -- Only add if they're actually in the family
    if exists (select 1 from public.family_members where id = v_pid and family_id = p_family_id) then
      insert into public.challenge_participants (challenge_id, family_member_id, current_value)
      values (v_challenge_id, v_pid, 0)
      on conflict (challenge_id, family_member_id) do nothing;
    end if;
  end loop;

  -- 3. Create tasks and link them
  for v_task_rec in select * from jsonb_array_elements(p_tasks)
  loop
    -- Map difficulty to points/coins
    v_points := case (v_task_rec->>'difficulty')
      when 'easy' then 5
      when 'medium' then 15
      when 'hard' then 50
      else 15
    end;
    v_coins := case (v_task_rec->>'difficulty')
      when 'easy' then 2
      when 'medium' then 7
      when 'hard' then 25
      else 7
    end;

    insert into public.tasks (
      title, difficulty, points, coins_reward,
      family_id, created_by, recurrence
    ) values (
      v_task_rec->>'title',
      (v_task_rec->>'difficulty')::public.task_difficulty,
      v_points, v_coins,
      p_family_id, p_created_by, 'none'
    ) returning id into v_task_id;

    insert into public.challenge_tasks (challenge_id, task_id, damage)
    values (v_challenge_id, v_task_id, (v_task_rec->>'damage')::int);
  end loop;

  return v_challenge_id;
end;
$$;
