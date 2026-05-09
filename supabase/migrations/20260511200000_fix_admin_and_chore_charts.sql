-- B1: Fix my_family_ids() — UNION instead of scalar CASE
CREATE OR REPLACE FUNCTION public.my_family_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id FROM public.families
   WHERE EXISTS (SELECT 1 FROM public.family_members WHERE user_id = auth.uid() AND role = 'admin')
  UNION
  SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
$$;

-- B2: is_family_parent() recognizes admin role
CREATE OR REPLACE FUNCTION public.is_family_parent(p_family_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
     WHERE family_id = p_family_id AND user_id = auth.uid() AND role IN ('parent', 'admin')
  );
$$;

-- B3: create_chore_chart always uses caller (ignore p_created_by)
CREATE OR REPLACE FUNCTION public.create_chore_chart(
  p_family_id uuid, p_title text, p_description text DEFAULT NULL,
  p_difficulty task_difficulty DEFAULT 'medium', p_points int DEFAULT 10,
  p_coins_reward int DEFAULT 1, p_schedule_type chore_schedule_type DEFAULT 'fixed',
  p_rotation_members uuid[] DEFAULT '{}', p_slots jsonb DEFAULT '[]',
  p_created_by uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_chart_id uuid; v_slot jsonb; v_caller uuid;
BEGIN
  SELECT fm.id INTO v_caller FROM public.family_members fm
   WHERE fm.user_id = auth.uid() AND fm.family_id = p_family_id;
  IF v_caller IS NULL THEN RAISE EXCEPTION 'not a member of this family'; END IF;

  INSERT INTO public.chore_charts (family_id, title, description, difficulty, points, coins_reward,
    schedule_type, rotation_members, created_by)
  VALUES (p_family_id, p_title, p_description, p_difficulty, p_points, p_coins_reward,
    p_schedule_type, p_rotation_members, v_caller)
  RETURNING id INTO v_chart_id;

  IF p_schedule_type = 'fixed' THEN
    FOR v_slot IN SELECT * FROM jsonb_array_elements(p_slots) LOOP
      INSERT INTO public.chore_chart_slots (chart_id, day_of_week, assignee_id)
      VALUES (v_chart_id, (v_slot->>'day_of_week')::smallint, (v_slot->>'assignee_id')::uuid);
    END LOOP;
  END IF;
  RETURN v_chart_id;
END; $$;

-- S4+B4: rotate_weekly generates Monday only, explicit conflict target
CREATE OR REPLACE FUNCTION public.generate_chore_tasks()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_today_dow smallint; v_iso_week int; v_chart record;
  v_assignee_id uuid; v_rotation_len int;
BEGIN
  v_today_dow := (extract(isodow FROM current_date) - 1)::smallint;
  v_iso_week  := extract(week FROM current_date)::int;

  FOR v_chart IN
    SELECT cc.id, cc.family_id, cc.title, cc.description,
           cc.difficulty, cc.points, cc.coins_reward, cc.created_by, ccs.assignee_id
      FROM public.chore_charts cc
      JOIN public.chore_chart_slots ccs ON ccs.chart_id = cc.id
     WHERE cc.is_active = true AND cc.schedule_type = 'fixed' AND ccs.day_of_week = v_today_dow
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.family_members WHERE id = v_chart.assignee_id) THEN CONTINUE; END IF;
    INSERT INTO public.tasks (family_id, title, description, difficulty, points, coins_reward,
      assignee_id, created_by, due_date, recurrence, source_chart_id)
    VALUES (v_chart.family_id, v_chart.title, v_chart.description, v_chart.difficulty,
      v_chart.points, v_chart.coins_reward, v_chart.assignee_id, v_chart.created_by,
      current_date::timestamptz, 'none', v_chart.id)
    ON CONFLICT (source_chart_id, due_date) WHERE source_chart_id IS NOT NULL DO NOTHING;
  END LOOP;

  IF v_today_dow = 0 THEN
    FOR v_chart IN
      SELECT id, family_id, title, description, difficulty, points, coins_reward,
             created_by, rotation_members
        FROM public.chore_charts
       WHERE is_active = true AND schedule_type = 'rotate_weekly' AND array_length(rotation_members, 1) >= 2
    LOOP
      v_rotation_len := array_length(v_chart.rotation_members, 1);
      v_assignee_id  := v_chart.rotation_members[(v_iso_week % v_rotation_len) + 1];
      IF NOT EXISTS (SELECT 1 FROM public.family_members WHERE id = v_assignee_id) THEN CONTINUE; END IF;
      INSERT INTO public.tasks (family_id, title, description, difficulty, points, coins_reward,
        assignee_id, created_by, due_date, recurrence, source_chart_id)
      VALUES (v_chart.family_id, v_chart.title, v_chart.description, v_chart.difficulty,
        v_chart.points, v_chart.coins_reward, v_assignee_id, v_chart.created_by,
        current_date::timestamptz, 'none', v_chart.id)
      ON CONFLICT (source_chart_id, due_date) WHERE source_chart_id IS NOT NULL DO NOTHING;
    END LOOP;
  END IF;
END; $$;

-- S2: Revoke direct execution from authenticated users (cron runs as superuser)
REVOKE EXECUTE ON FUNCTION public.generate_chore_tasks() FROM authenticated;
