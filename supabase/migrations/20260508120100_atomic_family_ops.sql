-- Atomic family creation: insert family + founding member in one transaction
-- Prevents orphaned family rows if the member insert fails
create or replace function public.create_family_with_member(
  p_name text,
  p_nickname text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family_id uuid;
begin
  insert into public.families (name, created_by)
  values (p_name, auth.uid())
  returning id into v_family_id;

  insert into public.family_members (family_id, user_id, role, nickname)
  values (v_family_id, auth.uid(), 'parent', p_nickname);

  return v_family_id;
end;
$$;

-- Atomic invite join: validate invite, insert member, mark accepted in one transaction
-- Prevents TOCTOU race where two users consume the same invite
create or replace function public.join_family_with_invite(
  p_invite_code uuid,
  p_nickname text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite record;
  v_family_id uuid;
begin
  -- Lock and validate the invite atomically
  update public.family_invites
  set accepted_at = now()
  where token = p_invite_code
    and accepted_at is null
    and expires_at > now()
  returning id, family_id into v_invite;

  if v_invite is null then
    raise exception 'Invalid, expired, or already-used invite code';
  end if;

  v_family_id := v_invite.family_id;

  insert into public.family_members (family_id, user_id, role, nickname)
  values (v_family_id, auth.uid(), 'child', p_nickname);

  return v_family_id;
end;
$$;
