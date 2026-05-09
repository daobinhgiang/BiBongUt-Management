-- Database webhook: trigger send-push edge function on notifications INSERT
--
-- Uses pg_net for async HTTP so we can read the service_role key from vault
-- at runtime instead of hardcoding it in the migration.

-- 1. Enable pg_net extension (async HTTP for Postgres)
create extension if not exists pg_net with schema extensions;

-- 2. Trigger function that fires the edge function via pg_net
create or replace function public.handle_notification_insert()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  _service_key text;
begin
  -- Read service role key from Supabase vault (set via Dashboard > Vault)
  select decrypted_secret into _service_key
    from vault.decrypted_secrets
    where name = 'service_role_key'
    limit 1;

  -- If vault secret not configured, fall back silently
  if _service_key is null then
    raise warning 'service_role_key not found in vault — skipping push notification for %', NEW.id;
    return NEW;
  end if;

  perform net.http_post(
    url    := 'https://bmyvkytdbarrfrkgsmak.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key
    ),
    body   := jsonb_build_object(
      'type',   'INSERT',
      'table',  'notifications',
      'record', row_to_json(NEW)
    )
  );

  return NEW;
end;
$$;

-- 3. Wire the trigger
create trigger on_notification_insert
  after insert on public.notifications
  for each row
  execute function public.handle_notification_insert();
