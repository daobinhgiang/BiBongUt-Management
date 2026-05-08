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
begin
  -- Get current level
  select level, total_xp + p_xp into v_old_level, v_new_xp
  from public.family_members where id = p_member_id for update;

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
