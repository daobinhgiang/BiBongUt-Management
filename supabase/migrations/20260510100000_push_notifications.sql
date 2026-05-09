-- ── Add push notification columns to family_members ──
alter table public.family_members
  add column if not exists push_token text,
  add column if not exists notification_prefs jsonb not null default '{
    "task_assigned": true,
    "task_overdue": true,
    "streak_at_risk": true,
    "badge_unlocked": true,
    "level_up": true,
    "family_invite": true
  }'::jsonb,
  add column if not exists timezone text not null default 'Asia/Ho_Chi_Minh';

-- ── Notifications table (audit log + retry queue) ──
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  type text not null, -- task_assigned, task_overdue, streak_at_risk, badge_unlocked, level_up, family_invite
  title text not null,
  body text not null,
  data jsonb default '{}'::jsonb, -- deep link payload: { screen, params }
  status text not null default 'pending', -- pending, sent, failed
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.notifications enable row level security;

-- Members can read their own notifications
create policy "notifications_select_own" on public.notifications
  for select using (
    family_member_id in (
      select id from public.family_members
      where user_id = auth.uid()
    )
  );

-- Index for retry queue (pg_cron picks up failed notifications)
create index if not exists notifications_pending
  on public.notifications (status, attempts)
  where status in ('pending', 'failed');

-- ── Trigger: task assigned ──
create or replace function public.trg_notify_task_assigned()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assignee_nickname text;
begin
  -- Only fire if task has an assignee
  if NEW.assignee_id is null then
    return NEW;
  end if;

  -- Get assignee nickname for the notification body
  select nickname into v_assignee_nickname
  from public.family_members where id = NEW.assignee_id;

  insert into public.notifications (family_member_id, type, title, body, data)
  values (
    NEW.assignee_id,
    'task_assigned',
    'New task for you!',
    'You''ve been assigned: ' || NEW.title,
    jsonb_build_object('screen', 'task', 'taskId', NEW.id)
  );

  return NEW;
end;
$$;

create trigger notify_task_assigned
  after insert on public.tasks
  for each row
  execute function public.trg_notify_task_assigned();

-- ── Trigger: badge unlocked ──
create or replace function public.trg_notify_badge_unlocked()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_badge_name text;
begin
  select name into v_badge_name
  from public.badges where id = NEW.badge_id;

  insert into public.notifications (family_member_id, type, title, body, data)
  values (
    NEW.family_member_id,
    'badge_unlocked',
    'Badge Unlocked!',
    'You earned: ' || coalesce(v_badge_name, 'a badge'),
    jsonb_build_object('screen', 'profile', 'memberId', NEW.family_member_id)
  );

  return NEW;
end;
$$;

create trigger notify_badge_unlocked
  after insert on public.badge_unlocks
  for each row
  execute function public.trg_notify_badge_unlocked();

-- ── Trigger: level up ──
create or replace function public.trg_notify_level_up()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only fire when level actually increased
  if NEW.level > OLD.level then
    insert into public.notifications (family_member_id, type, title, body, data)
    values (
      NEW.id,
      'level_up',
      'Level Up!',
      'You reached Level ' || NEW.level || '!',
      jsonb_build_object('screen', 'profile', 'memberId', NEW.id)
    );
  end if;

  return NEW;
end;
$$;

create trigger notify_level_up
  after update of level on public.family_members
  for each row
  execute function public.trg_notify_level_up();

-- ── Trigger: family invite accepted ──
create or replace function public.trg_notify_family_member_joined()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing_member record;
begin
  -- Notify all existing members in the family
  for v_existing_member in
    select id from public.family_members
    where family_id = NEW.family_id and id <> NEW.id
  loop
    insert into public.notifications (family_member_id, type, title, body, data)
    values (
      v_existing_member.id,
      'family_invite',
      'New family member!',
      NEW.nickname || ' joined the family!',
      jsonb_build_object('screen', 'profile', 'memberId', NEW.id)
    );
  end loop;

  return NEW;
end;
$$;

create trigger notify_family_member_joined
  after insert on public.family_members
  for each row
  execute function public.trg_notify_family_member_joined();

-- ── pg_cron: overdue task notifications (hourly) ──
create or replace function public.notify_overdue_tasks()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (family_member_id, type, title, body, data)
  select
    t.assignee_id,
    'task_overdue',
    'Task overdue!',
    t.title || ' was due ' || t.due_date,
    jsonb_build_object('screen', 'task', 'taskId', t.id)
  from public.tasks t
  where t.is_active = true
    and t.assignee_id is not null
    and t.due_date < current_date
    -- Don't send duplicate overdue notifications
    and not exists (
      select 1 from public.notifications n
      where n.family_member_id = t.assignee_id
        and n.type = 'task_overdue'
        and n.data->>'taskId' = t.id::text
        and n.created_at > current_date - 1
    );
end;
$$;

select cron.schedule(
  'notify-overdue-tasks',
  '0 * * * *', -- hourly
  $$select public.notify_overdue_tasks()$$
);

-- ── pg_cron: streak at-risk notifications (every hour, filter by local 21:00) ──
create or replace function public.notify_streak_at_risk()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (family_member_id, type, title, body, data)
  select
    fm.id,
    'streak_at_risk',
    'Your streak is at risk!',
    'Complete a task before midnight to keep your ' || fm.current_streak || '-day streak!',
    jsonb_build_object('screen', 'tasks')
  from public.family_members fm
  where fm.current_streak >= 3
    and (fm.last_active_date is null or fm.last_active_date < current_date)
    -- Check if it's around 21:00 in the member's timezone
    and extract(hour from now() at time zone fm.timezone) >= 21
    and extract(hour from now() at time zone fm.timezone) < 22
    -- Don't send duplicate streak warnings today
    and not exists (
      select 1 from public.notifications n
      where n.family_member_id = fm.id
        and n.type = 'streak_at_risk'
        and n.created_at > current_date::timestamptz
    );
end;
$$;

select cron.schedule(
  'notify-streak-at-risk',
  '0 * * * *', -- hourly, function filters by local time
  $$select public.notify_streak_at_risk()$$
);

-- ── pg_cron: retry failed notifications (every minute) ──
create or replace function public.retry_failed_notifications()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notifications
  set status = 'pending'
  where status = 'failed'
    and attempts < 3
    and created_at > now() - interval '1 day';
end;
$$;

select cron.schedule(
  'retry-failed-notifications',
  '* * * * *', -- every minute
  $$select public.retry_failed_notifications()$$
);
