-- Allow all family members (not just parents) to create/edit/delete chore charts

DROP POLICY "chore_charts_insert" ON public.chore_charts;
CREATE POLICY "chore_charts_insert" ON public.chore_charts
  FOR INSERT TO authenticated WITH CHECK (public.is_family_member(family_id));

DROP POLICY "chore_charts_update" ON public.chore_charts;
CREATE POLICY "chore_charts_update" ON public.chore_charts
  FOR UPDATE TO authenticated USING (public.is_family_member(family_id));

DROP POLICY "chore_charts_delete" ON public.chore_charts;
CREATE POLICY "chore_charts_delete" ON public.chore_charts
  FOR DELETE TO authenticated USING (public.is_family_member(family_id));

DROP POLICY "chore_chart_slots_insert" ON public.chore_chart_slots;
CREATE POLICY "chore_chart_slots_insert" ON public.chore_chart_slots
  FOR INSERT TO authenticated
  WITH CHECK (chart_id IN (SELECT id FROM public.chore_charts WHERE public.is_family_member(family_id)));

DROP POLICY "chore_chart_slots_update" ON public.chore_chart_slots;
CREATE POLICY "chore_chart_slots_update" ON public.chore_chart_slots
  FOR UPDATE TO authenticated
  USING (chart_id IN (SELECT id FROM public.chore_charts WHERE public.is_family_member(family_id)));

DROP POLICY "chore_chart_slots_delete" ON public.chore_chart_slots;
CREATE POLICY "chore_chart_slots_delete" ON public.chore_chart_slots
  FOR DELETE TO authenticated
  USING (chart_id IN (SELECT id FROM public.chore_charts WHERE public.is_family_member(family_id)));

-- Update RPCs: remove parent role check, allow any family member
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
    p_schedule_type, p_rotation_members, COALESCE(p_created_by, v_caller))
  RETURNING id INTO v_chart_id;

  IF p_schedule_type = 'fixed' THEN
    FOR v_slot IN SELECT * FROM jsonb_array_elements(p_slots) LOOP
      INSERT INTO public.chore_chart_slots (chart_id, day_of_week, assignee_id)
      VALUES (v_chart_id, (v_slot->>'day_of_week')::smallint, (v_slot->>'assignee_id')::uuid);
    END LOOP;
  END IF;
  RETURN v_chart_id;
END; $$;

CREATE OR REPLACE FUNCTION public.update_chore_chart(
  p_chart_id uuid, p_title text, p_description text DEFAULT NULL,
  p_difficulty task_difficulty DEFAULT 'medium', p_points int DEFAULT 10,
  p_coins_reward int DEFAULT 1, p_schedule_type chore_schedule_type DEFAULT 'fixed',
  p_rotation_members uuid[] DEFAULT '{}', p_slots jsonb DEFAULT '[]',
  p_is_active boolean DEFAULT true
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_family_id uuid; v_slot jsonb;
BEGIN
  SELECT cc.family_id INTO v_family_id FROM public.chore_charts cc
    JOIN public.family_members fm ON fm.family_id = cc.family_id
   WHERE cc.id = p_chart_id AND fm.user_id = auth.uid();
  IF v_family_id IS NULL THEN RAISE EXCEPTION 'chart not found or not authorized'; END IF;

  UPDATE public.chore_charts SET title = p_title, description = p_description,
    difficulty = p_difficulty, points = p_points, coins_reward = p_coins_reward,
    schedule_type = p_schedule_type, rotation_members = p_rotation_members, is_active = p_is_active
  WHERE id = p_chart_id;

  DELETE FROM public.chore_chart_slots WHERE chart_id = p_chart_id;
  IF p_schedule_type = 'fixed' THEN
    FOR v_slot IN SELECT * FROM jsonb_array_elements(p_slots) LOOP
      INSERT INTO public.chore_chart_slots (chart_id, day_of_week, assignee_id)
      VALUES (p_chart_id, (v_slot->>'day_of_week')::smallint, (v_slot->>'assignee_id')::uuid);
    END LOOP;
  END IF;
END; $$;
