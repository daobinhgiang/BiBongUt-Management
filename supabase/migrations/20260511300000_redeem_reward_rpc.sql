-- ══════════════════════════════════════════════════════════════════
-- Rewards: redeem_reward RPC + redemption notification trigger
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Atomic redeem_reward RPC ──
create or replace function public.redeem_reward(
  p_reward_id uuid,
  p_member_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reward record;
  v_member record;
  v_redemption_id uuid;
begin
  -- Auth check: caller must own this member row
  if not exists (
    select 1 from public.family_members
    where id = p_member_id and user_id = auth.uid()
  ) then
    raise exception 'Not authorized for this member';
  end if;

  -- 1. Validate reward exists and is active
  select * into v_reward
  from public.rewards
  where id = p_reward_id
  for update;

  if v_reward is null then
    raise exception 'Reward not found';
  end if;

  if not v_reward.is_active then
    raise exception 'Reward is no longer available';
  end if;

  -- 2. Validate member belongs to reward's family + lock for coin check
  select * into v_member
  from public.family_members
  where id = p_member_id
  for update;

  if v_member is null or v_member.family_id <> v_reward.family_id then
    raise exception 'Member does not belong to this family';
  end if;

  -- 3. Check sufficient balance
  if v_member.coins < v_reward.cost_coins then
    raise exception 'Insufficient coins: have %, need %', v_member.coins, v_reward.cost_coins;
  end if;

  -- 4. Deduct coins
  update public.family_members
  set coins = coins - v_reward.cost_coins
  where id = p_member_id;

  -- 5. Insert redemption record
  insert into public.reward_redemptions (reward_id, redeemed_by, coins_spent)
  values (p_reward_id, p_member_id, v_reward.cost_coins)
  returning id into v_redemption_id;

  -- 6. Insert transaction record (negative coins, 0 XP)
  insert into public.transactions (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
  values (p_member_id, 0, -v_reward.cost_coins,
          'Redeemed: ' || v_reward.title, 'reward_redemptions', v_redemption_id);

  -- 7. Return result
  return jsonb_build_object(
    'redemption_id', v_redemption_id,
    'coins_spent', v_reward.cost_coins,
    'remaining_coins', v_member.coins - v_reward.cost_coins,
    'reward_title', v_reward.title
  );
end;
$$;

-- ── 2. Trigger: notify parents when a child redeems a reward ──
create or replace function public.trg_notify_reward_redeemed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reward record;
  v_redeemer_nickname text;
  v_parent record;
begin
  -- Get reward info
  select * into v_reward
  from public.rewards where id = NEW.reward_id;

  -- Get redeemer nickname
  select nickname into v_redeemer_nickname
  from public.family_members where id = NEW.redeemed_by;

  -- Notify all parents in the family
  for v_parent in
    select id from public.family_members
    where family_id = v_reward.family_id
      and role = 'parent'
      and id <> NEW.redeemed_by
  loop
    insert into public.notifications (family_member_id, type, title, body, data)
    values (
      v_parent.id,
      'reward_redeemed',
      'Reward Redeemed!',
      coalesce(v_redeemer_nickname, 'Someone') || ' redeemed: ' || v_reward.title,
      jsonb_build_object('screen', 'rewards', 'rewardId', NEW.reward_id)
    );
  end loop;

  return NEW;
end;
$$;

create trigger notify_reward_redeemed
  after insert on public.reward_redemptions
  for each row
  execute function public.trg_notify_reward_redeemed();
