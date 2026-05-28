-- Dev-only RPC: resets all tasks completed today by a member.
-- Reverts XP, coins, completions, transactions, and daily chest claims.

create or replace function public.dev_reset_today_tasks(p_member_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comp record;
  v_count int := 0;
  v_total_xp int := 0;
  v_total_coins int := 0;
begin
  -- Loop through today's completions for this member
  for v_comp in
    select tc.id, tc.task_id, coalesce(tc.points_awarded, 0) as xp, coalesce(tc.coins_awarded, 0) as coins
    from public.task_completions tc
    where tc.completed_by = p_member_id
      and tc.completed_at::date = current_date
  loop
    -- Re-activate the task
    update public.tasks set is_active = true where id = v_comp.task_id;

    v_total_xp := v_total_xp + v_comp.xp;
    v_total_coins := v_total_coins + v_comp.coins;
    v_count := v_count + 1;
  end loop;

  -- Delete today's completions
  delete from public.task_completions
  where completed_by = p_member_id
    and completed_at::date = current_date;

  -- Delete today's transactions (task completions, level ups, daily chest)
  delete from public.transactions
  where family_member_id = p_member_id
    and created_at::date = current_date;

  -- Revert XP, coins, and recalculate level
  if v_total_xp > 0 or v_total_coins > 0 then
    update public.family_members set
      total_xp = greatest(0, total_xp - v_total_xp),
      coins = greatest(0, coins - v_total_coins),
      level = greatest(1, floor(sqrt(greatest(0, total_xp - v_total_xp)::numeric / 100)) + 1)
    where id = p_member_id;
  end if;

  return v_count;
end;
$$;
