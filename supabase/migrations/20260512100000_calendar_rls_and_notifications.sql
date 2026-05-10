-- Allow any family member (not just parents) to create/edit/delete calendar events,
-- add unique constraint for attendee upserts, and add notification trigger for new events.

-- 0. Unique constraint for upsert on event_attendees
alter table public.event_attendees
  add constraint event_attendees_event_member_unique
  unique (event_id, family_member_id);

-- 1. Drop restrictive parent-only policies
drop policy if exists calendar_events_insert on public.calendar_events;
drop policy if exists calendar_events_update on public.calendar_events;
drop policy if exists calendar_events_delete on public.calendar_events;

-- 2. Any family member can create events in their family
create policy calendar_events_insert on public.calendar_events for insert
  with check (family_id in (select my_family_ids()));

-- 3. Creator or parent can update
create policy calendar_events_update on public.calendar_events for update
  using (
    created_by = (
      select fm.id from public.family_members fm
      where fm.user_id = auth.uid() and fm.family_id = calendar_events.family_id
      limit 1
    )
    or is_family_parent(family_id)
  );

-- 4. Creator or parent can delete
create policy calendar_events_delete on public.calendar_events for delete
  using (
    created_by = (
      select fm.id from public.family_members fm
      where fm.user_id = auth.uid() and fm.family_id = calendar_events.family_id
      limit 1
    )
    or is_family_parent(family_id)
  );

-- 5. Notification trigger for new calendar events
create or replace function public.trg_notify_calendar_event_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creator_nickname text;
  v_member record;
begin
  -- Get creator nickname
  select nickname into v_creator_nickname
  from public.family_members where id = NEW.created_by;

  -- Notify all family members except the creator
  for v_member in
    select id from public.family_members
    where family_id = NEW.family_id and id <> NEW.created_by
  loop
    insert into public.notifications (family_member_id, type, title, body, data)
    values (
      v_member.id,
      'calendar_event',
      'New Event',
      v_creator_nickname || ' added "' || NEW.title || '"',
      jsonb_build_object('screen', 'calendar_event', 'eventId', NEW.id)
    );
  end loop;

  return NEW;
end;
$$;

create trigger trg_calendar_event_created
  after insert on public.calendar_events
  for each row
  execute function public.trg_notify_calendar_event_created();
