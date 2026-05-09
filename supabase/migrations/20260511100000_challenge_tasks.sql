-- ══════════════════════════════════════════════════════════════════
-- Challenges v2: Task-linked boss battles
-- Tasks complete → auto-deal damage to linked challenges
-- ══════════════════════════════════════════════════════════════════

-- ── 1. New columns on challenges for boss personality ──
alter table public.challenges
  add column if not exists boss_name text,
  add column if not exists boss_emoji text not null default '👹',
  add column if not exists template_id text;

-- ── 2. New table: challenge_tasks (links tasks to challenges) ──
create table public.challenge_tasks (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  damage int not null default 1,
  unique (challenge_id, task_id)
);

alter table public.challenge_tasks enable row level security;

-- Family members can see challenge_tasks
create policy challenge_tasks_select on public.challenge_tasks for select
  using (challenge_id in (
    select c.id from public.challenges c where c.family_id in (select my_family_ids())
  ));

-- Family members can insert (challenge creation flow uses SECURITY DEFINER RPC,
-- but belt-and-suspenders for direct inserts)
create policy challenge_tasks_insert on public.challenge_tasks for insert
  with check (challenge_id in (
    select c.id from public.challenges c where c.family_id in (select my_family_ids())
  ));

-- Family members can delete (for cleanup)
create policy challenge_tasks_delete on public.challenge_tasks for delete
  using (challenge_id in (
    select c.id from public.challenges c where c.family_id in (select my_family_ids())
  ));

-- Index for trigger lookup (find challenges linked to a completed task)
create index challenge_tasks_by_task on public.challenge_tasks (task_id);

-- ── 3. Modify log_challenge_contribution to support trigger calls ──
-- Add p_from_trigger param that skips auth.uid() check (only callable from SECURITY DEFINER)
create or replace function public.log_challenge_contribution(
  p_challenge_id uuid,
  p_member_id uuid,
  p_delta int,
  p_note text default null,
  p_from_trigger boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_challenge record;
  v_participant record;
  v_new_value int;
  v_total_value int;
  v_is_complete boolean := false;
  v_already_completed boolean;
  v_cp record;
  v_result jsonb;
begin
  -- Auth check: skip when called from trigger (trigger already validated via complete_task)
  if not p_from_trigger then
    if not exists (
      select 1 from public.family_members
      where id = p_member_id and user_id = auth.uid()
    ) then
      raise exception 'Not authorized for this member';
    end if;
  end if;

  -- Lock and validate challenge
  select * into v_challenge
  from public.challenges
  where id = p_challenge_id
  for update;

  if v_challenge is null then
    raise exception 'Challenge not found';
  end if;

  -- If challenge is already completed/failed/cancelled, reject gracefully
  if v_challenge.status <> 'active' then
    return jsonb_build_object(
      'error', 'Challenge is no longer active',
      'status', v_challenge.status::text
    );
  end if;

  -- Validate member is a participant
  select * into v_participant
  from public.challenge_participants
  where challenge_id = p_challenge_id and family_member_id = p_member_id
  for update;

  if v_participant is null then
    raise exception 'You are not a participant in this challenge';
  end if;

  -- Validate delta is positive
  if p_delta <= 0 then
    raise exception 'Contribution must be positive';
  end if;

  -- Track whether this participant already completed (for double-award guard)
  v_already_completed := v_participant.completed_at is not null;

  -- 1. Insert log entry
  insert into public.challenge_logs (challenge_id, participant_id, delta, note)
  values (p_challenge_id, v_participant.id, p_delta, p_note);

  -- 2. Update participant's current_value
  v_new_value := v_participant.current_value + p_delta;
  update public.challenge_participants
  set current_value = v_new_value
  where id = v_participant.id;

  -- 3. Check if challenge is now complete
  if v_challenge.type = 'solo' then
    if v_new_value >= v_challenge.target_value and not v_already_completed then
      update public.challenge_participants
      set completed_at = now()
      where id = v_participant.id;

      perform public.award_points(
        p_member_id,
        v_challenge.reward_xp,
        v_challenge.reward_coins,
        'Challenge completed: ' || v_challenge.title,
        'challenges',
        p_challenge_id
      );

      if not exists (
        select 1 from public.challenge_participants
        where challenge_id = p_challenge_id and completed_at is null
      ) then
        v_is_complete := true;
      end if;
    end if;

  else
    -- Collaborative / Boss Battle
    select coalesce(sum(current_value), 0) into v_total_value
    from public.challenge_participants
    where challenge_id = p_challenge_id;

    if v_total_value >= v_challenge.target_value then
      v_is_complete := true;

      for v_cp in
        select cp.family_member_id
        from public.challenge_participants cp
        where cp.challenge_id = p_challenge_id
          and cp.current_value > 0
          and cp.completed_at is null
        order by cp.family_member_id
      loop
        perform public.award_points(
          v_cp.family_member_id,
          v_challenge.reward_xp,
          v_challenge.reward_coins,
          'Challenge completed: ' || v_challenge.title,
          'challenges',
          p_challenge_id
        );
      end loop;

      update public.challenge_participants
      set completed_at = now()
      where challenge_id = p_challenge_id and completed_at is null;
    end if;
  end if;

  -- 4. If challenge is complete, update status
  if v_is_complete then
    update public.challenges
    set status = 'completed'
    where id = p_challenge_id;
  end if;

  -- 5. Build result
  v_result := jsonb_build_object(
    'new_value', v_new_value,
    'challenge_complete', v_is_complete,
    'challenge_type', v_challenge.type::text,
    'target_value', v_challenge.target_value,
    'reward_xp', case when v_is_complete or (v_challenge.type = 'solo' and v_new_value >= v_challenge.target_value and not v_already_completed) then v_challenge.reward_xp else 0 end,
    'reward_coins', case when v_is_complete or (v_challenge.type = 'solo' and v_new_value >= v_challenge.target_value and not v_already_completed) then v_challenge.reward_coins else 0 end
  );

  if v_challenge.type in ('collaborative', 'boss_battle') then
    select coalesce(sum(current_value), 0) into v_total_value
    from public.challenge_participants
    where challenge_id = p_challenge_id;

    v_result := v_result || jsonb_build_object('total_value', v_total_value);
  end if;

  return v_result;
end;
$$;

-- ── 4. Trigger: auto-deal damage when a linked task is completed ──
create or replace function public.trg_task_completion_deals_damage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ct record;
  v_member_id uuid;
begin
  -- Only fire when task is deactivated (completed via complete_task RPC)
  if OLD.is_active = true and NEW.is_active = false then
    -- Find the member who completed it
    select completed_by into v_member_id
    from public.task_completions
    where task_id = NEW.id
    order by completed_at desc
    limit 1;

    if v_member_id is null then
      return NEW;
    end if;

    -- Deal damage for each challenge this task is linked to
    for v_ct in
      select ct.challenge_id, ct.damage
      from public.challenge_tasks ct
      join public.challenges c on c.id = ct.challenge_id
      where ct.task_id = NEW.id
        and c.status = 'active'
    loop
      -- Only deal damage if the member is a participant
      if exists (
        select 1 from public.challenge_participants
        where challenge_id = v_ct.challenge_id
          and family_member_id = v_member_id
      ) then
        perform public.log_challenge_contribution(
          v_ct.challenge_id,
          v_member_id,
          v_ct.damage,
          'Completed: ' || NEW.title,
          true  -- p_from_trigger = true, skip auth check
        );
      end if;
    end loop;
  end if;

  return NEW;
end;
$$;

create trigger task_completion_deals_damage
  after update of is_active on public.tasks
  for each row
  execute function public.trg_task_completion_deals_damage();

-- ── 5. Trigger: sync challenge target_value when challenge_tasks change ──
create or replace function public.trg_sync_challenge_target()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.challenges
  set target_value = (
    select coalesce(sum(damage), 0)
    from public.challenge_tasks
    where challenge_id = coalesce(NEW.challenge_id, OLD.challenge_id)
  )
  where id = coalesce(NEW.challenge_id, OLD.challenge_id);

  return coalesce(NEW, OLD);
end;
$$;

create trigger sync_challenge_target
  after insert or delete on public.challenge_tasks
  for each row
  execute function public.trg_sync_challenge_target();
