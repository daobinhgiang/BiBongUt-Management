-- =============================================================================
-- Chore Charts: weekly schedule templates that auto-generate daily tasks
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enum
-- ---------------------------------------------------------------------------
CREATE TYPE chore_schedule_type AS ENUM ('fixed', 'rotate_weekly');

-- ---------------------------------------------------------------------------
-- 2. chore_charts table (the template)
-- ---------------------------------------------------------------------------
CREATE TABLE public.chore_charts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       uuid        NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text,
  difficulty      task_difficulty NOT NULL DEFAULT 'medium',
  points          int         NOT NULL DEFAULT 10,
  coins_reward    int         NOT NULL DEFAULT 1,
  schedule_type   chore_schedule_type NOT NULL DEFAULT 'fixed',
  rotation_members uuid[]    NOT NULL DEFAULT '{}',
  is_active       boolean     NOT NULL DEFAULT true,
  created_by      uuid        NOT NULL REFERENCES public.family_members(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chore_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chore_charts_select" ON public.chore_charts
  FOR SELECT TO authenticated
  USING (family_id IN (SELECT public.my_family_ids()));

CREATE POLICY "chore_charts_insert" ON public.chore_charts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_family_parent(family_id));

CREATE POLICY "chore_charts_update" ON public.chore_charts
  FOR UPDATE TO authenticated
  USING (public.is_family_parent(family_id));

CREATE POLICY "chore_charts_delete" ON public.chore_charts
  FOR DELETE TO authenticated
  USING (public.is_family_parent(family_id));

CREATE INDEX idx_chore_charts_family_active
  ON public.chore_charts (family_id) WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- 3. chore_chart_slots table (day → assignee for fixed charts)
-- ---------------------------------------------------------------------------
CREATE TABLE public.chore_chart_slots (
  id          uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id    uuid     NOT NULL REFERENCES public.chore_charts(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon..6=Sun
  assignee_id uuid     NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  CONSTRAINT unique_chart_day UNIQUE (chart_id, day_of_week)
);

ALTER TABLE public.chore_chart_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chore_chart_slots_select" ON public.chore_chart_slots
  FOR SELECT TO authenticated
  USING (
    chart_id IN (
      SELECT id FROM public.chore_charts
      WHERE family_id IN (SELECT public.my_family_ids())
    )
  );

CREATE POLICY "chore_chart_slots_insert" ON public.chore_chart_slots
  FOR INSERT TO authenticated
  WITH CHECK (
    chart_id IN (
      SELECT id FROM public.chore_charts
      WHERE public.is_family_parent(family_id)
    )
  );

CREATE POLICY "chore_chart_slots_update" ON public.chore_chart_slots
  FOR UPDATE TO authenticated
  USING (
    chart_id IN (
      SELECT id FROM public.chore_charts
      WHERE public.is_family_parent(family_id)
    )
  );

CREATE POLICY "chore_chart_slots_delete" ON public.chore_chart_slots
  FOR DELETE TO authenticated
  USING (
    chart_id IN (
      SELECT id FROM public.chore_charts
      WHERE public.is_family_parent(family_id)
    )
  );

CREATE INDEX idx_chore_chart_slots_chart_dow
  ON public.chore_chart_slots (chart_id, day_of_week);

-- ---------------------------------------------------------------------------
-- 4. Add source_chart_id to tasks (nullable FK for dedup)
-- ---------------------------------------------------------------------------
ALTER TABLE public.tasks
  ADD COLUMN source_chart_id uuid REFERENCES public.chore_charts(id) ON DELETE SET NULL;

-- Dedup: chart-generated tasks use current_date::timestamptz (midnight UTC), so same due_date = same day
CREATE UNIQUE INDEX tasks_chart_date_unique
  ON public.tasks (source_chart_id, due_date)
  WHERE source_chart_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. create_chore_chart() RPC — atomic chart + slots creation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_chore_chart(
  p_family_id       uuid,
  p_title           text,
  p_description     text         DEFAULT NULL,
  p_difficulty      task_difficulty DEFAULT 'medium',
  p_points          int          DEFAULT 10,
  p_coins_reward    int          DEFAULT 1,
  p_schedule_type   chore_schedule_type DEFAULT 'fixed',
  p_rotation_members uuid[]      DEFAULT '{}',
  p_slots           jsonb        DEFAULT '[]',
  p_created_by      uuid         DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_chart_id uuid;
  v_slot     jsonb;
  v_caller   uuid;
BEGIN
  -- Validate caller is parent in this family
  SELECT fm.id INTO v_caller
    FROM public.family_members fm
   WHERE fm.user_id = auth.uid()
     AND fm.family_id = p_family_id
     AND fm.role = 'parent';

  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'only parents can create chore charts';
  END IF;

  INSERT INTO public.chore_charts (
    family_id, title, description, difficulty, points, coins_reward,
    schedule_type, rotation_members, created_by
  ) VALUES (
    p_family_id, p_title, p_description, p_difficulty, p_points, p_coins_reward,
    p_schedule_type, p_rotation_members, COALESCE(p_created_by, v_caller)
  ) RETURNING id INTO v_chart_id;

  -- Insert slots (for fixed schedule)
  IF p_schedule_type = 'fixed' THEN
    FOR v_slot IN SELECT * FROM jsonb_array_elements(p_slots) LOOP
      INSERT INTO public.chore_chart_slots (chart_id, day_of_week, assignee_id)
      VALUES (
        v_chart_id,
        (v_slot->>'day_of_week')::smallint,
        (v_slot->>'assignee_id')::uuid
      );
    END LOOP;
  END IF;

  RETURN v_chart_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. update_chore_chart() RPC — atomic update + slot replacement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_chore_chart(
  p_chart_id        uuid,
  p_title           text,
  p_description     text         DEFAULT NULL,
  p_difficulty      task_difficulty DEFAULT 'medium',
  p_points          int          DEFAULT 10,
  p_coins_reward    int          DEFAULT 1,
  p_schedule_type   chore_schedule_type DEFAULT 'fixed',
  p_rotation_members uuid[]      DEFAULT '{}',
  p_slots           jsonb        DEFAULT '[]',
  p_is_active       boolean      DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_family_id uuid;
  v_slot      jsonb;
BEGIN
  -- Validate chart exists and caller is parent
  SELECT cc.family_id INTO v_family_id
    FROM public.chore_charts cc
    JOIN public.family_members fm ON fm.family_id = cc.family_id
   WHERE cc.id = p_chart_id
     AND fm.user_id = auth.uid()
     AND fm.role = 'parent';

  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'chart not found or not authorized';
  END IF;

  UPDATE public.chore_charts SET
    title = p_title,
    description = p_description,
    difficulty = p_difficulty,
    points = p_points,
    coins_reward = p_coins_reward,
    schedule_type = p_schedule_type,
    rotation_members = p_rotation_members,
    is_active = p_is_active
  WHERE id = p_chart_id;

  -- Replace slots
  DELETE FROM public.chore_chart_slots WHERE chart_id = p_chart_id;

  IF p_schedule_type = 'fixed' THEN
    FOR v_slot IN SELECT * FROM jsonb_array_elements(p_slots) LOOP
      INSERT INTO public.chore_chart_slots (chart_id, day_of_week, assignee_id)
      VALUES (
        p_chart_id,
        (v_slot->>'day_of_week')::smallint,
        (v_slot->>'assignee_id')::uuid
      );
    END LOOP;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. generate_chore_tasks() — daily task factory
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_chore_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today_dow    smallint;
  v_iso_week     int;
  v_chart        record;
  v_assignee_id  uuid;
  v_rotation_len int;
BEGIN
  -- 0=Mon..6=Sun (ISO convention)
  v_today_dow := (extract(isodow FROM current_date) - 1)::smallint;
  v_iso_week  := extract(week FROM current_date)::int;

  -- FIXED charts: use chore_chart_slots for today's day
  FOR v_chart IN
    SELECT cc.id, cc.family_id, cc.title, cc.description,
           cc.difficulty, cc.points, cc.coins_reward, cc.created_by,
           ccs.assignee_id
      FROM public.chore_charts cc
      JOIN public.chore_chart_slots ccs ON ccs.chart_id = cc.id
     WHERE cc.is_active = true
       AND cc.schedule_type = 'fixed'
       AND ccs.day_of_week = v_today_dow
  LOOP
    -- Skip if assignee no longer exists
    IF NOT EXISTS (SELECT 1 FROM public.family_members WHERE id = v_chart.assignee_id) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.tasks (
      family_id, title, description, difficulty, points, coins_reward,
      assignee_id, created_by, due_date, recurrence, source_chart_id
    ) VALUES (
      v_chart.family_id, v_chart.title, v_chart.description,
      v_chart.difficulty, v_chart.points, v_chart.coins_reward,
      v_chart.assignee_id, v_chart.created_by,
      current_date::timestamptz, 'none', v_chart.id
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- ROTATE_WEEKLY charts: assignee cycles based on week number
  FOR v_chart IN
    SELECT id, family_id, title, description,
           difficulty, points, coins_reward, created_by,
           rotation_members
      FROM public.chore_charts
     WHERE is_active = true
       AND schedule_type = 'rotate_weekly'
       AND array_length(rotation_members, 1) >= 2
  LOOP
    v_rotation_len := array_length(v_chart.rotation_members, 1);
    v_assignee_id  := v_chart.rotation_members[(v_iso_week % v_rotation_len) + 1];

    -- Skip if assignee no longer exists
    IF NOT EXISTS (SELECT 1 FROM public.family_members WHERE id = v_assignee_id) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.tasks (
      family_id, title, description, difficulty, points, coins_reward,
      assignee_id, created_by, due_date, recurrence, source_chart_id
    ) VALUES (
      v_chart.family_id, v_chart.title, v_chart.description,
      v_chart.difficulty, v_chart.points, v_chart.coins_reward,
      v_assignee_id, v_chart.created_by,
      current_date::timestamptz, 'none', v_chart.id
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Schedule daily cron job (00:05 UTC, after streak resets)
-- ---------------------------------------------------------------------------
SELECT cron.schedule(
  'generate-chore-tasks',
  '5 0 * * *',
  $$SELECT public.generate_chore_tasks()$$
);
