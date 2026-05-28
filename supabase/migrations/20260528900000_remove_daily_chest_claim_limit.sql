-- Remove the once-per-day limit on daily chest claims.
-- The chest can now be claimed every time all daily tasks are completed.

create or replace function public.claim_daily_chest(p_member_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coins int;
begin
  -- Random coins between 5 and 20
  v_coins := floor(random() * 16 + 5)::int;

  -- Award coins
  update public.family_members
  set coins = coins + v_coins
  where id = p_member_id;

  -- Record transaction
  insert into public.transactions (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
  values (p_member_id, 0, v_coins, 'Daily chest reward', 'daily_chest', p_member_id);

  return jsonb_build_object('coins_awarded', v_coins, 'already_claimed', false);
end;
$$;
