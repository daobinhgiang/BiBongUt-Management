-- Atomic RPC to claim daily chest reward (5-20 random coins)
-- Prevents double-claiming by checking transactions table for today's entry.

create or replace function public.claim_daily_chest(p_member_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coins int;
  v_today date := current_date;
begin
  -- Check if already claimed today
  if exists (
    select 1 from public.transactions
    where family_member_id = p_member_id
      and ref_table = 'daily_chest'
      and created_at::date = v_today
  ) then
    return jsonb_build_object('coins_awarded', 0, 'already_claimed', true);
  end if;

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
