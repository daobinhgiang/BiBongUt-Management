-- =============================================================================
-- Security fixes, CASCADE constraints, and performance indexes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fix award_points(): add validation + authorization
--    Blocker: function was callable by anyone, no member existence check
-- ---------------------------------------------------------------------------
create or replace function public.award_points(
  p_member_id uuid, p_xp int, p_coins int,
  p_reason text, p_ref_table text, p_ref_id uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_level int;
  v_new_level int;
  v_new_xp int;
  v_family_id uuid;
begin
  -- Validate member exists and lock the row
  select level, total_xp + p_xp, fm.family_id
    into v_old_level, v_new_xp, v_family_id
  from public.family_members fm
  where fm.id = p_member_id
  for update;

  if v_old_level is null then
    raise exception 'family member % not found', p_member_id;
  end if;

  -- Authorization: caller must be a parent in the same family
  if not exists (
    select 1 from public.family_members
    where family_id = v_family_id
      and user_id = auth.uid()
      and role = 'parent'
  ) then
    raise exception 'only parents in the same family can award points';
  end if;

  -- Calculate new level: level = floor(sqrt(total_xp / 100)) + 1
  v_new_level := floor(sqrt(v_new_xp::numeric / 100)) + 1;

  -- Update member totals
  update public.family_members set
    total_xp = v_new_xp,
    coins = coins + p_coins,
    level = v_new_level
  where id = p_member_id;

  -- Insert transaction record
  insert into public.transactions (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
  values (p_member_id, p_xp, p_coins, p_reason, p_ref_table, p_ref_id);

  -- If level changed, write a level_up transaction
  if v_new_level > v_old_level then
    insert into public.transactions (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
    values (p_member_id, 0, 0, 'level_up:' || v_new_level, 'family_members', p_member_id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Fix badges RLS: global table, restrict writes to service role only
--    Blocker: any parent from any family could create/edit/delete badges
-- ---------------------------------------------------------------------------
drop policy if exists badges_insert on public.badges;
drop policy if exists badges_update on public.badges;
drop policy if exists badges_delete on public.badges;

-- No insert/update/delete policies = only service_role can write
-- SELECT remains open (using (true)) so all users can read badges

-- ---------------------------------------------------------------------------
-- 3. Fix family_members_update_self: restrict which columns a user can change
--    Suggestion: users could self-escalate role, XP, coins, level
-- ---------------------------------------------------------------------------
drop policy if exists family_members_update_self on public.family_members;

create policy family_members_update_self on public.family_members
  for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    -- Prevent self-escalation: these columns must stay the same
    and role = (select fm.role from public.family_members fm where fm.id = family_members.id)
    and level = (select fm.level from public.family_members fm where fm.id = family_members.id)
    and total_xp = (select fm.total_xp from public.family_members fm where fm.id = family_members.id)
    and coins = (select fm.coins from public.family_members fm where fm.id = family_members.id)
    and current_streak = (select fm.current_streak from public.family_members fm where fm.id = family_members.id)
    and longest_streak = (select fm.longest_streak from public.family_members fm where fm.id = family_members.id)
  );

-- ---------------------------------------------------------------------------
-- 4. Add ON DELETE CASCADE to child table foreign keys
-- ---------------------------------------------------------------------------

-- family_members.family_id -> families
alter table public.family_members
  drop constraint family_members_family_id_fkey,
  add constraint family_members_family_id_fkey
    foreign key (family_id) references public.families(id) on delete cascade;

-- family_invites.family_id -> families
alter table public.family_invites
  drop constraint family_invites_family_id_fkey,
  add constraint family_invites_family_id_fkey
    foreign key (family_id) references public.families(id) on delete cascade;

-- tasks.family_id -> families
alter table public.tasks
  drop constraint tasks_family_id_fkey,
  add constraint tasks_family_id_fkey
    foreign key (family_id) references public.families(id) on delete cascade;

-- tasks.assignee_id -> family_members
alter table public.tasks
  drop constraint tasks_assignee_id_fkey,
  add constraint tasks_assignee_id_fkey
    foreign key (assignee_id) references public.family_members(id) on delete set null;

-- tasks.created_by -> family_members
alter table public.tasks
  drop constraint tasks_created_by_fkey,
  add constraint tasks_created_by_fkey
    foreign key (created_by) references public.family_members(id) on delete cascade;

-- task_completions.task_id -> tasks
alter table public.task_completions
  drop constraint task_completions_task_id_fkey,
  add constraint task_completions_task_id_fkey
    foreign key (task_id) references public.tasks(id) on delete cascade;

-- task_completions.completed_by -> family_members
alter table public.task_completions
  drop constraint task_completions_completed_by_fkey,
  add constraint task_completions_completed_by_fkey
    foreign key (completed_by) references public.family_members(id) on delete cascade;

-- transactions.family_member_id -> family_members
alter table public.transactions
  drop constraint transactions_family_member_id_fkey,
  add constraint transactions_family_member_id_fkey
    foreign key (family_member_id) references public.family_members(id) on delete cascade;

-- badge_unlocks.family_member_id -> family_members
alter table public.badge_unlocks
  drop constraint badge_unlocks_family_member_id_fkey,
  add constraint badge_unlocks_family_member_id_fkey
    foreign key (family_member_id) references public.family_members(id) on delete cascade;

-- badge_unlocks.badge_id -> badges
alter table public.badge_unlocks
  drop constraint badge_unlocks_badge_id_fkey,
  add constraint badge_unlocks_badge_id_fkey
    foreign key (badge_id) references public.badges(id) on delete cascade;

-- bucket_list_items.family_id -> families
alter table public.bucket_list_items
  drop constraint bucket_list_items_family_id_fkey,
  add constraint bucket_list_items_family_id_fkey
    foreign key (family_id) references public.families(id) on delete cascade;

-- movies.family_id -> families
alter table public.movies
  drop constraint movies_family_id_fkey,
  add constraint movies_family_id_fkey
    foreign key (family_id) references public.families(id) on delete cascade;

-- movie_watches.movie_id -> movies
alter table public.movie_watches
  drop constraint movie_watches_movie_id_fkey,
  add constraint movie_watches_movie_id_fkey
    foreign key (movie_id) references public.movies(id) on delete cascade;

-- challenges.family_id -> families
alter table public.challenges
  drop constraint challenges_family_id_fkey,
  add constraint challenges_family_id_fkey
    foreign key (family_id) references public.families(id) on delete cascade;

-- challenge_participants.challenge_id -> challenges
alter table public.challenge_participants
  drop constraint challenge_participants_challenge_id_fkey,
  add constraint challenge_participants_challenge_id_fkey
    foreign key (challenge_id) references public.challenges(id) on delete cascade;

-- challenge_participants.family_member_id -> family_members
alter table public.challenge_participants
  drop constraint challenge_participants_family_member_id_fkey,
  add constraint challenge_participants_family_member_id_fkey
    foreign key (family_member_id) references public.family_members(id) on delete cascade;

-- calendar_events.family_id -> families
alter table public.calendar_events
  drop constraint calendar_events_family_id_fkey,
  add constraint calendar_events_family_id_fkey
    foreign key (family_id) references public.families(id) on delete cascade;

-- event_attendees.event_id -> calendar_events
alter table public.event_attendees
  drop constraint event_attendees_event_id_fkey,
  add constraint event_attendees_event_id_fkey
    foreign key (event_id) references public.calendar_events(id) on delete cascade;

-- event_attendees.family_member_id -> family_members
alter table public.event_attendees
  drop constraint event_attendees_family_member_id_fkey,
  add constraint event_attendees_family_member_id_fkey
    foreign key (family_member_id) references public.family_members(id) on delete cascade;

-- rewards.family_id -> families
alter table public.rewards
  drop constraint rewards_family_id_fkey,
  add constraint rewards_family_id_fkey
    foreign key (family_id) references public.families(id) on delete cascade;

-- reward_redemptions.reward_id -> rewards
alter table public.reward_redemptions
  drop constraint reward_redemptions_reward_id_fkey,
  add constraint reward_redemptions_reward_id_fkey
    foreign key (reward_id) references public.rewards(id) on delete cascade;

-- reward_redemptions.redeemed_by -> family_members
alter table public.reward_redemptions
  drop constraint reward_redemptions_redeemed_by_fkey,
  add constraint reward_redemptions_redeemed_by_fkey
    foreign key (redeemed_by) references public.family_members(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 5. Add indexes on frequently queried FK columns
-- ---------------------------------------------------------------------------
create index if not exists idx_family_members_family_id on public.family_members(family_id);
create index if not exists idx_family_members_user_id on public.family_members(user_id);
create index if not exists idx_tasks_family_id on public.tasks(family_id);
create index if not exists idx_tasks_assignee_id on public.tasks(assignee_id);
create index if not exists idx_task_completions_task_id on public.task_completions(task_id);
create index if not exists idx_task_completions_completed_by on public.task_completions(completed_by);
create index if not exists idx_transactions_family_member_id on public.transactions(family_member_id);
create index if not exists idx_badge_unlocks_family_member_id on public.badge_unlocks(family_member_id);
create index if not exists idx_bucket_list_items_family_id on public.bucket_list_items(family_id);
create index if not exists idx_movies_family_id on public.movies(family_id);
create index if not exists idx_movie_watches_movie_id on public.movie_watches(movie_id);
create index if not exists idx_challenges_family_id on public.challenges(family_id);
create index if not exists idx_challenge_participants_challenge_id on public.challenge_participants(challenge_id);
create index if not exists idx_calendar_events_family_id on public.calendar_events(family_id);
create index if not exists idx_event_attendees_event_id on public.event_attendees(event_id);
create index if not exists idx_rewards_family_id on public.rewards(family_id);
create index if not exists idx_reward_redemptions_reward_id on public.reward_redemptions(reward_id);
create index if not exists idx_reward_redemptions_redeemed_by on public.reward_redemptions(redeemed_by);
create index if not exists idx_family_invites_family_id on public.family_invites(family_id);
create index if not exists idx_family_invites_token on public.family_invites(token);
