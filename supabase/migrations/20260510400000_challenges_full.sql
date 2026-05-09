-- ══════════════════════════════════════════════════════════════════
-- Challenges feature: extend shell tables, add logs, RPCs, triggers
-- ══════════════════════════════════════════════════════════════════

-- ── 1. New enum: challenge_type ──
create type public.challenge_type as enum ('solo', 'collaborative', 'boss_battle');

-- ── 2. Extend challenge_status enum with 'failed' ──
alter type public.challenge_status add value if not exists 'failed';

-- ── 3. Extend challenges table ──
alter table public.challenges
  add column if not exists type public.challenge_type not null default 'solo',
  add column if not exists target_value int not null default 1,
  add column if not exists unit text not null default 'times',
  add column if not exists reward_xp int not null default 0,
  add column if not exists reward_coins int not null default 0;

-- Legacy `points` column kept as-is (default 0, unused by new code).
-- We use reward_xp/reward_coins going forward.

-- Index for active challenges per family
create index if not exists challenges_family_active
  on public.challenges (family_id, status)
  where status = 'active';

-- ── 4. Extend challenge_participants ──
alter table public.challenge_participants
  add column if not exists current_value int not null default 0;

-- Unique constraint: one row per member per challenge
alter table public.challenge_participants
  add constraint challenge_participants_unique
    unique (challenge_id, family_member_id);

-- ── 5. Create challenge_logs (append-only) ──
create table public.challenge_logs (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  participant_id uuid not null references public.challenge_participants(id) on delete cascade,
  delta int not null,
  note text,
  logged_at timestamptz not null default now()
);

alter table public.challenge_logs enable row level security;

-- Logs are visible to family members
create policy challenge_logs_select on public.challenge_logs for select
  using (challenge_id in (
    select c.id from public.challenges c where c.family_id in (select my_family_ids())
  ));

-- Any family member in the challenge's family can insert logs (via RPC, belt-and-suspenders)
create policy challenge_logs_insert on public.challenge_logs for insert
  with check (challenge_id in (
    select c.id from public.challenges c where c.family_id in (select my_family_ids())
  ));

-- No update/delete — append-only
create index challenge_logs_by_challenge
  on public.challenge_logs (challenge_id, logged_at desc);

-- ── 5b. Allow all family members to create challenges (not just parents) ──
drop policy if exists challenges_insert on public.challenges;
create policy challenges_insert on public.challenges for insert
  with check (is_family_member(family_id));

-- ── 6. Fix RLS: children can join challenges and update their own participation ──
drop policy if exists challenge_participants_insert on public.challenge_participants;
drop policy if exists challenge_participants_update on public.challenge_participants;

-- Any family member can join a challenge in their family (must be their own member row)
create policy challenge_participants_insert on public.challenge_participants for insert
  with check (
    challenge_id in (
      select c.id from public.challenges c where c.family_id in (select my_family_ids())
    )
    and family_member_id in (
      select fm.id from public.family_members fm where fm.user_id = auth.uid()
    )
  );

-- Participants can update their own row (current_value), parents can update any
create policy challenge_participants_update on public.challenge_participants for update
  using (
    family_member_id in (
      select fm.id from public.family_members fm where fm.user_id = auth.uid()
    )
    or challenge_id in (
      select c.id from public.challenges c where is_family_parent(c.family_id)
    )
  );

-- ── 7. RPC: log_challenge_contribution ──
-- Atomic: insert log + update participant value + check completion + award points
create or replace function public.log_challenge_contribution(
  p_challenge_id uuid,
  p_member_id uuid,
  p_delta int,
  p_note text default null
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
  -- Auth check: caller must own this member row
  if not exists (
    select 1 from public.family_members
    where id = p_member_id and user_id = auth.uid()
  ) then
    raise exception 'Not authorized for this member';
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

  -- Track whether this participant already completed (for solo double-award guard)
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
    -- Solo: check if THIS participant just hit the target (guard against double-award)
    if v_new_value >= v_challenge.target_value and not v_already_completed then
      -- Mark this participant as completed
      update public.challenge_participants
      set completed_at = now()
      where id = v_participant.id;

      -- Award points to this participant
      perform public.award_points(
        p_member_id,
        v_challenge.reward_xp,
        v_challenge.reward_coins,
        'Challenge completed: ' || v_challenge.title,
        'challenges',
        p_challenge_id
      );

      -- Check if ALL participants have now completed
      if not exists (
        select 1 from public.challenge_participants
        where challenge_id = p_challenge_id and completed_at is null
      ) then
        v_is_complete := true;
      end if;
    end if;

  else
    -- Collaborative / Boss Battle: sum all participants' values
    select coalesce(sum(current_value), 0) into v_total_value
    from public.challenge_participants
    where challenge_id = p_challenge_id;

    if v_total_value >= v_challenge.target_value then
      v_is_complete := true;

      -- Award points to each participant who contributed (FOR loop, not PERFORM...FROM)
      for v_cp in
        select cp.family_member_id
        from public.challenge_participants cp
        where cp.challenge_id = p_challenge_id
          and cp.current_value > 0
          and cp.completed_at is null  -- guard against double-award on re-entry
        order by cp.family_member_id   -- deterministic lock order prevents deadlocks
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

      -- Mark all as completed
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

  -- For collaborative/boss, include the shared total
  if v_challenge.type in ('collaborative', 'boss_battle') then
    select coalesce(sum(current_value), 0) into v_total_value
    from public.challenge_participants
    where challenge_id = p_challenge_id;

    v_result := v_result || jsonb_build_object('total_value', v_total_value);
  end if;

  return v_result;
end;
$$;

-- ── 8. RPC: join_challenge ──
create or replace function public.join_challenge(
  p_challenge_id uuid,
  p_member_id uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_challenge record;
begin
  -- Auth check: caller must own this member row
  if not exists (
    select 1 from public.family_members
    where id = p_member_id and user_id = auth.uid()
  ) then
    raise exception 'Not authorized for this member';
  end if;

  select * into v_challenge
  from public.challenges
  where id = p_challenge_id and status = 'active';

  if v_challenge is null then
    raise exception 'Challenge not found or not active';
  end if;

  -- Verify member belongs to the same family
  if not exists (
    select 1 from public.family_members
    where id = p_member_id and family_id = v_challenge.family_id
  ) then
    raise exception 'You do not belong to this challenge''s family';
  end if;

  -- Idempotent insert (unique constraint prevents duplicates)
  insert into public.challenge_participants (challenge_id, family_member_id)
  values (p_challenge_id, p_member_id)
  on conflict (challenge_id, family_member_id) do nothing;
end;
$$;

-- ── 9. Trigger: notify on challenge completion ──
create or replace function public.trg_notify_challenge_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant record;
begin
  if NEW.status = 'completed' and OLD.status = 'active' then
    for v_participant in
      select cp.family_member_id
      from public.challenge_participants cp
      where cp.challenge_id = NEW.id
    loop
      insert into public.notifications (family_member_id, type, title, body, data)
      values (
        v_participant.family_member_id,
        'challenge_completed',
        'Challenge Complete!',
        NEW.title || ' has been completed!',
        jsonb_build_object('screen', 'challenge', 'challengeId', NEW.id)
      );
    end loop;
  end if;

  return NEW;
end;
$$;

create trigger notify_challenge_completed
  after update of status on public.challenges
  for each row
  execute function public.trg_notify_challenge_completed();

-- ── 10. Trigger: notify other participants on progress ──
create or replace function public.trg_notify_challenge_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_challenge record;
  v_logger_nickname text;
  v_other_participant record;
begin
  select c.*, cp.family_member_id as logger_member_id
  into v_challenge
  from public.challenges c
  join public.challenge_participants cp on cp.id = NEW.participant_id
  where c.id = NEW.challenge_id;

  -- Guard: if challenge was deleted between log insert and trigger
  if v_challenge is null then
    return NEW;
  end if;

  select nickname into v_logger_nickname
  from public.family_members
  where id = v_challenge.logger_member_id;

  for v_other_participant in
    select cp.family_member_id
    from public.challenge_participants cp
    where cp.challenge_id = NEW.challenge_id
      and cp.family_member_id <> v_challenge.logger_member_id
  loop
    insert into public.notifications (family_member_id, type, title, body, data)
    values (
      v_other_participant.family_member_id,
      'challenge_progress',
      'Challenge Progress!',
      coalesce(v_logger_nickname, 'Someone') || ' logged ' || NEW.delta || ' ' || v_challenge.unit || '!',
      jsonb_build_object('screen', 'challenge', 'challengeId', NEW.challenge_id)
    );
  end loop;

  return NEW;
end;
$$;

create trigger notify_challenge_progress
  after insert on public.challenge_logs
  for each row
  execute function public.trg_notify_challenge_progress();

-- ── 11. pg_cron: expire failed challenges past deadline ──
create or replace function public.expire_failed_challenges()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.challenges
  set status = 'failed'
  where status = 'active'
    and end_date is not null
    and end_date < now();
end;
$$;

select cron.schedule(
  'expire-failed-challenges',
  '0 0 * * *', -- daily at midnight
  $$select public.expire_failed_challenges()$$
);

-- ── 12. Update notification_prefs default with challenge types ──
alter table public.family_members
  alter column notification_prefs
  set default '{
    "task_assigned": true,
    "task_overdue": true,
    "streak_at_risk": true,
    "badge_unlocked": true,
    "level_up": true,
    "family_invite": true,
    "challenge_completed": true,
    "challenge_progress": true
  }'::jsonb;
