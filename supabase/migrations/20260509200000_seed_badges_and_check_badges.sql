-- =============================================================================
-- Seed badges (~15) and create check_badges() function + trigger
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Seed badges
-- ---------------------------------------------------------------------------
insert into public.badges (code, name, description, criteria, xp_reward, coins_reward) values
  -- Chores
  ('first_task',       'First Steps',       'Complete your first task',
   '{"type":"task_count","threshold":1}',          10,  5),
  ('task_10',          'Routine Master',    'Complete 10 tasks',
   '{"type":"task_count","threshold":10}',         50,  25),
  ('task_50',          'Task Champion',     'Complete 50 tasks',
   '{"type":"task_count","threshold":50}',         200, 100),
  ('task_100',         'Task Legend',       'Complete 100 tasks',
   '{"type":"task_count","threshold":100}',        500, 250),
  ('busy_bee',         'Busy Bee',          'Complete 5 tasks in a single day',
   '{"type":"tasks_in_day","threshold":5}',        40,  20),

  -- Variety
  ('all_difficulties', 'Jack of All Trades','Complete tasks of every difficulty',
   '{"type":"all_difficulties"}',                  75,  30),
  ('hard_5',           'Tough Cookie',      'Complete 5 hard tasks',
   '{"type":"difficulty_count","difficulty":"hard","threshold":5}', 100, 50),

  -- Social
  ('helping_hand',     'Helping Hand',      'Complete a task created by another member',
   '{"type":"social_task","threshold":1}',         30,  15),
  ('team_player',      'Team Player',       'Complete 5 tasks created by other members',
   '{"type":"social_task","threshold":5}',         75,  35),

  -- Streak
  ('streak_3',         'On Fire',           'Maintain a 3-day streak',
   '{"type":"streak","threshold":3}',              30,  15),
  ('streak_7',         'Week Warrior',      'Maintain a 7-day streak',
   '{"type":"streak","threshold":7}',              75,  35),
  ('streak_30',        'Unstoppable',       'Maintain a 30-day streak',
   '{"type":"streak","threshold":30}',             300, 150),

  -- Level
  ('level_5',          'Rising Star',       'Reach level 5',
   '{"type":"level","threshold":5}',               50,  25),
  ('level_10',         'Powerhouse',        'Reach level 10',
   '{"type":"level","threshold":10}',              150, 75),
  ('level_25',         'Elite',             'Reach level 25',
   '{"type":"level","threshold":25}',              500, 250)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- 2. check_badges(p_member_id) — idempotent badge evaluator
-- ---------------------------------------------------------------------------
create or replace function public.check_badges(p_member_id uuid)
returns setof uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_badge       record;
  v_earned      boolean;
  v_member      record;
  v_task_count  int;
  v_unlocked    uuid[] := '{}';
begin
  -- 1. Fetch member stats (single row lock-free read)
  select level, current_streak, longest_streak
    into v_member
    from public.family_members
   where id = p_member_id;

  if v_member is null then
    return;
  end if;

  -- 2. Pre-compute total completions (used by multiple badge types)
  select count(*)::int into v_task_count
    from public.task_completions
   where completed_by = p_member_id;

  -- 3. Loop only over badges this member has NOT yet unlocked
  for v_badge in
    select b.*
      from public.badges b
     where not exists (
       select 1 from public.badge_unlocks bu
        where bu.badge_id = b.id
          and bu.family_member_id = p_member_id
     )
  loop
    v_earned := false;

    case v_badge.criteria->>'type'

      -- "Complete N tasks total"
      when 'task_count' then
        v_earned := v_task_count >= (v_badge.criteria->>'threshold')::int;

      -- "Complete N tasks in a single day"
      when 'tasks_in_day' then
        v_earned := exists (
          select 1
            from public.task_completions
           where completed_by = p_member_id
           group by completed_at::date
          having count(*) >= (v_badge.criteria->>'threshold')::int
        );

      -- "Complete tasks of every difficulty (easy, medium, hard)"
      when 'all_difficulties' then
        v_earned := (
          select count(distinct t.difficulty) = 3
            from public.task_completions tc
            join public.tasks t on t.id = tc.task_id
           where tc.completed_by = p_member_id
        );

      -- "Complete N tasks of a specific difficulty"
      when 'difficulty_count' then
        v_earned := (
          select count(*) >= (v_badge.criteria->>'threshold')::int
            from public.task_completions tc
            join public.tasks t on t.id = tc.task_id
           where tc.completed_by = p_member_id
             and t.difficulty::text = v_badge.criteria->>'difficulty'
        );

      -- "Complete N tasks created by another member"
      when 'social_task' then
        v_earned := (
          select count(*) >= (v_badge.criteria->>'threshold')::int
            from public.task_completions tc
            join public.tasks t on t.id = tc.task_id
           where tc.completed_by = p_member_id
             and t.created_by is distinct from p_member_id
        );

      -- "Reach a streak of N days"
      when 'streak' then
        v_earned := greatest(v_member.current_streak, v_member.longest_streak)
                    >= (v_badge.criteria->>'threshold')::int;

      -- "Reach level N"
      when 'level' then
        v_earned := v_member.level >= (v_badge.criteria->>'threshold')::int;

      else
        continue;  -- unknown type, skip
    end case;

    if v_earned then
      -- Insert unlock (ON CONFLICT for idempotency)
      insert into public.badge_unlocks (family_member_id, badge_id)
      values (p_member_id, v_badge.id)
      on conflict (family_member_id, badge_id) do nothing;

      -- Award badge rewards via inline update (mirrors complete_task pattern)
      if v_badge.xp_reward > 0 or v_badge.coins_reward > 0 then
        update public.family_members set
          total_xp = total_xp + v_badge.xp_reward,
          coins    = coins + v_badge.coins_reward,
          level    = floor(sqrt((total_xp + v_badge.xp_reward)::numeric / 100)) + 1
        where id = p_member_id;

        insert into public.transactions
          (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
        values
          (p_member_id, v_badge.xp_reward, v_badge.coins_reward,
           'Badge unlocked: ' || v_badge.name, 'badges', v_badge.id);
      end if;

      -- Refresh member level so subsequent level-badge checks see updated value
      if v_badge.xp_reward > 0 then
        select level, current_streak, longest_streak
          into v_member
          from public.family_members
         where id = p_member_id;
      end if;

      v_unlocked := v_unlocked || v_badge.id;
    end if;
  end loop;

  return query select unnest(v_unlocked);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Trigger: auto-run check_badges after every task completion
-- ---------------------------------------------------------------------------
create or replace function public.trg_check_badges_after_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.check_badges(new.completed_by);
  return new;
end;
$$;

drop trigger if exists check_badges_after_task_completion on public.task_completions;
create trigger check_badges_after_task_completion
  after insert on public.task_completions
  for each row
  execute function public.trg_check_badges_after_completion();
