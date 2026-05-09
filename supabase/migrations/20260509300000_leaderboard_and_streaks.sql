-- Leaderboard history: weekly snapshots archived by pg_cron
create table if not exists public.leaderboard_history (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  xp_earned int not null default 0,
  rank int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.leaderboard_history enable row level security;

create policy "leaderboard_history_select" on public.leaderboard_history
  for select using (family_id in (select public.my_family_ids()));

-- Unique constraint: one entry per member per week
create unique index if not exists leaderboard_history_member_week
  on public.leaderboard_history (family_member_id, week_start);

-- ── Weekly leaderboard snapshot function ──
-- Called by pg_cron every Sunday at 23:59
create or replace function public.snapshot_weekly_leaderboard()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_week_start date;
  v_week_end date;
begin
  -- Calculate current week boundaries (Monday to Sunday)
  v_week_end := current_date;
  v_week_start := v_week_end - (extract(dow from v_week_end)::int + 6) % 7;

  -- Insert ranked weekly XP for all members
  insert into public.leaderboard_history
    (family_id, family_member_id, week_start, week_end, xp_earned, rank)
  select
    fm.family_id,
    fm.id,
    v_week_start,
    v_week_end,
    coalesce(sum(t.delta_xp), 0) as xp_earned,
    rank() over (
      partition by fm.family_id
      order by coalesce(sum(t.delta_xp), 0) desc
    ) as rank
  from public.family_members fm
  left join public.transactions t
    on t.family_member_id = fm.id
    and t.created_at >= v_week_start::timestamptz
    and t.created_at < (v_week_end + 1)::timestamptz
    and t.delta_xp > 0
  group by fm.id, fm.family_id
  on conflict (family_member_id, week_start) do update set
    xp_earned = excluded.xp_earned,
    rank = excluded.rank;
end;
$$;

-- ── Streak reset function ──
-- Called by pg_cron daily at midnight: resets streaks for members
-- who didn't complete a task yesterday
create or replace function public.reset_stale_streaks()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.family_members
  set current_streak = 0
  where current_streak > 0
    and (last_active_date is null or last_active_date < current_date - 1);
end;
$$;

-- ── Performance index for weekly leaderboard queries ──
create index if not exists transactions_member_created
  on public.transactions (family_member_id, created_at);

-- ── pg_cron schedules ──
create extension if not exists pg_cron schema pg_catalog;

-- Reset stale streaks daily at midnight UTC
select cron.schedule(
  'reset-stale-streaks',
  '0 0 * * *',
  $$select public.reset_stale_streaks()$$
);

-- Snapshot weekly leaderboard every Sunday at 23:59 UTC
select cron.schedule(
  'snapshot-weekly-leaderboard',
  '59 23 * * 0',
  $$select public.snapshot_weekly_leaderboard()$$
);

-- ── Update streak on task completion ──
-- Called from complete_task or as a trigger; updates streak counters
create or replace function public.update_streak(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_last_active date;
  v_current int;
  v_longest int;
begin
  select last_active_date, current_streak, longest_streak
  into v_last_active, v_current, v_longest
  from public.family_members
  where id = p_member_id
  for update;

  -- Already active today, nothing to do
  if v_last_active = current_date then
    return;
  end if;

  if v_last_active = current_date - 1 then
    -- Consecutive day: increment streak
    v_current := v_current + 1;
  else
    -- Streak broken or first activity: start at 1
    v_current := 1;
  end if;

  if v_current > v_longest then
    v_longest := v_current;
  end if;

  update public.family_members
  set current_streak = v_current,
      longest_streak = v_longest,
      last_active_date = current_date
  where id = p_member_id;
end;
$$;
