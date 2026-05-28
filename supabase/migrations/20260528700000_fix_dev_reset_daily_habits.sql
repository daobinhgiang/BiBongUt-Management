-- Fix dev_reset_today_tasks: reactivating a completed daily habit conflicts with
-- replacement rows seeded by ensure_daily_habits (uq_daily_habit_per_member_day).

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
  for v_comp in
    select
      tc.id,
      tc.task_id,
      coalesce(tc.points_awarded, 0) as xp,
      coalesce(tc.coins_awarded, 0) as coins,
      t.task_type,
      t.family_id,
      t.assignee_id,
      t.title,
      t.due_date
    from public.task_completions tc
    join public.tasks t on t.id = tc.task_id
    where tc.completed_by = p_member_id
      and tc.completed_at::date = current_date
  loop
    -- Remove replacement active daily habits before reactivating the original.
    if v_comp.task_type = 'daily_habit' then
      delete from public.tasks
      where task_type = 'daily_habit'
        and is_active = true
        and id <> v_comp.task_id
        and family_id = v_comp.family_id
        and assignee_id = v_comp.assignee_id
        and title = v_comp.title
        and due_date = v_comp.due_date;
    end if;

    update public.tasks set is_active = true where id = v_comp.task_id;

    v_total_xp := v_total_xp + v_comp.xp;
    v_total_coins := v_total_coins + v_comp.coins;
    v_count := v_count + 1;
  end loop;

  delete from public.task_completions
  where completed_by = p_member_id
    and completed_at::date = current_date;

  delete from public.transactions
  where family_member_id = p_member_id
    and created_at::date = current_date;

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
