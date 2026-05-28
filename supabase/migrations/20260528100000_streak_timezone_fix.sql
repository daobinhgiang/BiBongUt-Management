-- Fix: update_streak() and reset_stale_streaks() used current_date (server UTC),
-- which causes incorrect streak calculations for users in non-UTC timezones.
-- Now both functions use the member's timezone column to determine "today".

-- ── update_streak: use member's local date ──
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
  v_today date;
  v_tz text;
begin
  select last_active_date, current_streak, longest_streak, timezone
  into v_last_active, v_current, v_longest, v_tz
  from public.family_members
  where id = p_member_id
  for update;

  v_today := (now() at time zone coalesce(v_tz, 'Asia/Ho_Chi_Minh'))::date;

  -- Already active today, nothing to do
  if v_last_active = v_today then
    return;
  end if;

  if v_last_active = v_today - 1 then
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
      last_active_date = v_today
  where id = p_member_id;
end;
$$;

-- ── reset_stale_streaks: check each member's local date ──
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
    and (
      last_active_date is null
      or last_active_date < (now() at time zone coalesce(timezone, 'Asia/Ho_Chi_Minh'))::date - 1
    );
end;
$$;

-- ── Re-schedule reset_stale_streaks to run every hour ──
-- Since members may be in different timezones, running only at midnight UTC
-- is insufficient. Hourly checks ensure streaks reset near each member's
-- local midnight (the per-row WHERE clause handles correctness).
select cron.unschedule('reset-stale-streaks');
select cron.schedule(
  'reset-stale-streaks',
  '0 * * * *',
  $$select public.reset_stale_streaks()$$
);
