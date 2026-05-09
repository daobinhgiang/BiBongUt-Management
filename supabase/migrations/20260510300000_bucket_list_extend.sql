-- =============================================================================
-- Bucket List: extend shell with categories, priorities, completions, photos
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. New enums
-- ---------------------------------------------------------------------------
CREATE TYPE bucket_list_category AS ENUM ('travel', 'experience', 'skill', 'other');
CREATE TYPE bucket_list_priority AS ENUM ('small', 'medium', 'large');

-- ---------------------------------------------------------------------------
-- 2. Migrate status enum: bucket_status(pending,done) → bucket_list_status(open,in_progress,completed)
-- ---------------------------------------------------------------------------
CREATE TYPE bucket_list_status AS ENUM ('open', 'in_progress', 'completed');

ALTER TABLE public.bucket_list_items
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE bucket_list_status
    USING CASE status::text
      WHEN 'pending' THEN 'open'::bucket_list_status
      WHEN 'done' THEN 'completed'::bucket_list_status
    END,
  ALTER COLUMN status SET DEFAULT 'open';

DROP TYPE bucket_status;

-- ---------------------------------------------------------------------------
-- 3. Add new columns to bucket_list_items
-- ---------------------------------------------------------------------------
ALTER TABLE public.bucket_list_items
  ADD COLUMN category bucket_list_category NOT NULL DEFAULT 'other',
  ADD COLUMN target_date date,
  ADD COLUMN priority bucket_list_priority NOT NULL DEFAULT 'medium';

-- Set points defaults based on priority for existing rows
UPDATE public.bucket_list_items SET points = CASE priority
  WHEN 'small' THEN 50
  WHEN 'medium' THEN 150
  WHEN 'large' THEN 500
END WHERE points = 0;

-- ---------------------------------------------------------------------------
-- 4. Create bucket_list_completions table
-- ---------------------------------------------------------------------------
CREATE TABLE public.bucket_list_completions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     uuid        NOT NULL REFERENCES public.bucket_list_items(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  location    text,
  photos      text[]      NOT NULL DEFAULT '{}',
  notes       text,
  participants uuid[]     NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bucket_list_completions ENABLE ROW LEVEL SECURITY;

-- SELECT: family members can see completions for their family's items
CREATE POLICY "bucket_list_completions_select" ON public.bucket_list_completions
  FOR SELECT TO authenticated
  USING (
    item_id IN (
      SELECT id FROM public.bucket_list_items
      WHERE family_id IN (SELECT public.my_family_ids())
    )
  );

-- INSERT: family members (for direct inserts; RPC also works via SECURITY DEFINER)
CREATE POLICY "bucket_list_completions_insert" ON public.bucket_list_completions
  FOR INSERT TO authenticated
  WITH CHECK (
    item_id IN (
      SELECT id FROM public.bucket_list_items
      WHERE family_id IN (SELECT public.my_family_ids())
    )
  );

-- UPDATE: parents only
CREATE POLICY "bucket_list_completions_update" ON public.bucket_list_completions
  FOR UPDATE TO authenticated
  USING (
    item_id IN (
      SELECT id FROM public.bucket_list_items bli
      WHERE public.is_family_parent(bli.family_id)
    )
  );

-- DELETE: parents only
CREATE POLICY "bucket_list_completions_delete" ON public.bucket_list_completions
  FOR DELETE TO authenticated
  USING (
    item_id IN (
      SELECT id FROM public.bucket_list_items bli
      WHERE public.is_family_parent(bli.family_id)
    )
  );

-- Indexes
CREATE INDEX idx_blc_item_id ON public.bucket_list_completions(item_id);
CREATE INDEX idx_blc_completed_at ON public.bucket_list_completions(completed_at DESC);

-- ---------------------------------------------------------------------------
-- 5. Relax UPDATE policy: members can update their own items
-- ---------------------------------------------------------------------------
DROP POLICY "bucket_list_items_update" ON public.bucket_list_items;

CREATE POLICY "bucket_list_items_update" ON public.bucket_list_items
  FOR UPDATE TO authenticated
  USING (
    is_family_parent(family_id)
    OR created_by IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Storage bucket for bucket list photos
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bucket-list-photos',
  'bucket-list-photos',
  true,
  5242880, -- 5MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Family members can view photos in their family folder
CREATE POLICY "blp_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'bucket-list-photos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT public.my_family_ids())
  );

-- Family members can upload to their family folder
CREATE POLICY "blp_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'bucket-list-photos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT public.my_family_ids())
  );

-- Uploader can update own photos
CREATE POLICY "blp_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'bucket-list-photos'
    AND owner_id = auth.uid()::text
  );

-- Parents can delete photos in their family folder
CREATE POLICY "blp_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'bucket-list-photos'
    AND EXISTS (
      SELECT 1 FROM public.family_members
      WHERE user_id = auth.uid()
        AND role = 'parent'
        AND family_id::text = (storage.foldername(name))[1]
    )
  );

-- ---------------------------------------------------------------------------
-- 7. Seed badges (task badges + bucket list badges, idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO public.badges (code, name, description, criteria, xp_reward, coins_reward) VALUES
  -- Task badges (from seed migration that may not have been applied)
  ('first_task',       'First Steps',        'Complete your first task',
   '{"type":"task_count","threshold":1}',          10,  5),
  ('task_10',          'Routine Master',     'Complete 10 tasks',
   '{"type":"task_count","threshold":10}',         50,  25),
  ('task_50',          'Task Champion',      'Complete 50 tasks',
   '{"type":"task_count","threshold":50}',         200, 100),
  ('task_100',         'Task Legend',        'Complete 100 tasks',
   '{"type":"task_count","threshold":100}',        500, 250),
  ('busy_bee',         'Busy Bee',           'Complete 5 tasks in a single day',
   '{"type":"tasks_in_day","threshold":5}',        40,  20),
  ('all_difficulties', 'Jack of All Trades', 'Complete tasks of every difficulty',
   '{"type":"all_difficulties"}',                  75,  30),
  ('hard_5',           'Tough Cookie',       'Complete 5 hard tasks',
   '{"type":"difficulty_count","difficulty":"hard","threshold":5}', 100, 50),
  ('helping_hand',     'Helping Hand',       'Complete a task created by another member',
   '{"type":"social_task","threshold":1}',         30,  15),
  ('team_player',      'Team Player',        'Complete 5 tasks created by other members',
   '{"type":"social_task","threshold":5}',         75,  35),
  ('streak_3',         'On Fire',            'Maintain a 3-day streak',
   '{"type":"streak","threshold":3}',              30,  15),
  ('streak_7',         'Week Warrior',       'Maintain a 7-day streak',
   '{"type":"streak","threshold":7}',              75,  35),
  ('streak_30',        'Unstoppable',        'Maintain a 30-day streak',
   '{"type":"streak","threshold":30}',             300, 150),
  ('level_5',          'Rising Star',        'Reach level 5',
   '{"type":"level","threshold":5}',               50,  25),
  ('level_10',         'Powerhouse',         'Reach level 10',
   '{"type":"level","threshold":10}',              150, 75),
  ('level_25',         'Elite',              'Reach level 25',
   '{"type":"level","threshold":25}',              500, 250),
  -- Bucket list badges
  ('first_memory',     'First Memory',       'Complete your first bucket list item',
   '{"type":"bucket_completion_count","threshold":1}', 25, 10),
  ('memory_maker',     'Memory Maker',       'Complete 10 bucket list items',
   '{"type":"bucket_completion_count","threshold":10}', 200, 100),
  ('adventurer',       'Adventurer',         'Complete 5 travel bucket list items',
   '{"type":"bucket_category_count","category":"travel","threshold":5}', 150, 75),
  ('skill_builder',    'Skill Builder',      'Complete 5 skill bucket list items',
   '{"type":"bucket_category_count","category":"skill","threshold":5}', 150, 75)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. check_badges() — full function with task + bucket list badge types
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_badges(p_member_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_badge       record;
  v_earned      boolean;
  v_member      record;
  v_task_count  int;
  v_bucket_count int;
  v_unlocked    uuid[] := '{}';
BEGIN
  -- 1. Fetch member stats
  SELECT level, current_streak, longest_streak
    INTO v_member
    FROM public.family_members
   WHERE id = p_member_id;

  IF v_member IS NULL THEN
    RETURN;
  END IF;

  -- 2. Pre-compute counts
  SELECT count(*)::int INTO v_task_count
    FROM public.task_completions
   WHERE completed_by = p_member_id;

  SELECT count(*)::int INTO v_bucket_count
    FROM public.bucket_list_completions
   WHERE p_member_id = ANY(participants);

  -- 3. Loop only over badges not yet unlocked
  FOR v_badge IN
    SELECT b.*
      FROM public.badges b
     WHERE NOT EXISTS (
       SELECT 1 FROM public.badge_unlocks bu
        WHERE bu.badge_id = b.id
          AND bu.family_member_id = p_member_id
     )
  LOOP
    v_earned := false;

    CASE v_badge.criteria->>'type'

      -- Task badges
      WHEN 'task_count' THEN
        v_earned := v_task_count >= (v_badge.criteria->>'threshold')::int;

      WHEN 'tasks_in_day' THEN
        v_earned := EXISTS (
          SELECT 1 FROM public.task_completions
           WHERE completed_by = p_member_id
           GROUP BY completed_at::date
          HAVING count(*) >= (v_badge.criteria->>'threshold')::int
        );

      WHEN 'all_difficulties' THEN
        v_earned := (
          SELECT count(DISTINCT t.difficulty) = 3
            FROM public.task_completions tc
            JOIN public.tasks t ON t.id = tc.task_id
           WHERE tc.completed_by = p_member_id
        );

      WHEN 'difficulty_count' THEN
        v_earned := (
          SELECT count(*) >= (v_badge.criteria->>'threshold')::int
            FROM public.task_completions tc
            JOIN public.tasks t ON t.id = tc.task_id
           WHERE tc.completed_by = p_member_id
             AND t.difficulty::text = v_badge.criteria->>'difficulty'
        );

      WHEN 'social_task' THEN
        v_earned := (
          SELECT count(*) >= (v_badge.criteria->>'threshold')::int
            FROM public.task_completions tc
            JOIN public.tasks t ON t.id = tc.task_id
           WHERE tc.completed_by = p_member_id
             AND t.created_by IS DISTINCT FROM p_member_id
        );

      WHEN 'streak' THEN
        v_earned := greatest(v_member.current_streak, v_member.longest_streak)
                    >= (v_badge.criteria->>'threshold')::int;

      WHEN 'level' THEN
        v_earned := v_member.level >= (v_badge.criteria->>'threshold')::int;

      -- Bucket list badges
      WHEN 'bucket_completion_count' THEN
        v_earned := v_bucket_count >= (v_badge.criteria->>'threshold')::int;

      WHEN 'bucket_category_count' THEN
        v_earned := (
          SELECT count(*) >= (v_badge.criteria->>'threshold')::int
            FROM public.bucket_list_completions blc
            JOIN public.bucket_list_items bli ON bli.id = blc.item_id
           WHERE p_member_id = ANY(blc.participants)
             AND bli.category::text = v_badge.criteria->>'category'
        );

      ELSE
        CONTINUE;
    END CASE;

    IF v_earned THEN
      INSERT INTO public.badge_unlocks (family_member_id, badge_id)
      VALUES (p_member_id, v_badge.id)
      ON CONFLICT (family_member_id, badge_id) DO NOTHING;

      IF v_badge.xp_reward > 0 OR v_badge.coins_reward > 0 THEN
        UPDATE public.family_members SET
          total_xp = total_xp + v_badge.xp_reward,
          coins    = coins + v_badge.coins_reward,
          level    = floor(sqrt((total_xp + v_badge.xp_reward)::numeric / 100)) + 1
        WHERE id = p_member_id;

        INSERT INTO public.transactions
          (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
        VALUES
          (p_member_id, v_badge.xp_reward, v_badge.coins_reward,
           'Badge unlocked: ' || v_badge.name, 'badges', v_badge.id);
      END IF;

      IF v_badge.xp_reward > 0 THEN
        SELECT level, current_streak, longest_streak
          INTO v_member
          FROM public.family_members
         WHERE id = p_member_id;
      END IF;

      v_unlocked := v_unlocked || v_badge.id;
    END IF;
  END LOOP;

  RETURN QUERY SELECT unnest(v_unlocked);
END;
$$;

-- Trigger: auto-run check_badges after task completion (idempotent)
CREATE OR REPLACE FUNCTION public.trg_check_badges_after_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.check_badges(new.completed_by);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS check_badges_after_task_completion ON public.task_completions;
CREATE TRIGGER check_badges_after_task_completion
  AFTER INSERT ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_badges_after_completion();

-- ---------------------------------------------------------------------------
-- 9. complete_bucket_list_item() RPC — atomic completion + points + badges
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_bucket_list_item(
  p_item_id     uuid,
  p_location    text     DEFAULT NULL,
  p_photos      text[]   DEFAULT '{}',
  p_notes       text     DEFAULT NULL,
  p_participants uuid[]  DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item            record;
  v_caller_member_id uuid;
  v_completion_id   uuid;
  v_xp              int;
  v_participant     uuid;
  v_old_level       int;
  v_new_xp          int;
  v_new_level       int;
BEGIN
  -- 1. Validate caller is a family member for this item
  SELECT fm.id INTO v_caller_member_id
    FROM public.family_members fm
    JOIN public.bucket_list_items bli ON bli.family_id = fm.family_id
   WHERE bli.id = p_item_id AND fm.user_id = auth.uid();

  IF v_caller_member_id IS NULL THEN
    RAISE EXCEPTION 'not a member of this family or item not found';
  END IF;

  -- 2. Fetch and lock the item
  SELECT * INTO v_item
    FROM public.bucket_list_items
   WHERE id = p_item_id
  FOR UPDATE;

  IF v_item.status::text = 'completed' THEN
    RAISE EXCEPTION 'item already completed';
  END IF;

  -- 3. Determine XP based on priority
  v_xp := CASE v_item.priority::text
    WHEN 'small'  THEN 50
    WHEN 'medium' THEN 150
    WHEN 'large'  THEN 500
    ELSE 150
  END;

  -- 4. Insert completion record
  INSERT INTO public.bucket_list_completions
    (item_id, location, photos, notes, participants, completed_at)
  VALUES
    (p_item_id, p_location, p_photos, p_notes, p_participants, now())
  RETURNING id INTO v_completion_id;

  -- 5. Update item status
  UPDATE public.bucket_list_items
     SET status = 'completed', completed_at = now(), points = v_xp
   WHERE id = p_item_id;

  -- 6. Award XP to each participant (inline — no parent check needed)
  FOREACH v_participant IN ARRAY p_participants LOOP
    SELECT level, total_xp + v_xp
      INTO v_old_level, v_new_xp
      FROM public.family_members
     WHERE id = v_participant AND family_id = v_item.family_id
    FOR UPDATE;

    IF v_old_level IS NULL THEN
      CONTINUE; -- skip invalid participant
    END IF;

    v_new_level := floor(sqrt(v_new_xp::numeric / 100)) + 1;

    UPDATE public.family_members
       SET total_xp = v_new_xp, level = v_new_level
     WHERE id = v_participant;

    INSERT INTO public.transactions
      (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
    VALUES
      (v_participant, v_xp, 0,
       'Bucket list: ' || v_item.title, 'bucket_list_completions', v_completion_id);

    IF v_new_level > v_old_level THEN
      INSERT INTO public.transactions
        (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
      VALUES
        (v_participant, 0, 0, 'level_up:' || v_new_level, 'family_members', v_participant);
    END IF;

    -- Check badges for this participant
    PERFORM public.check_badges(v_participant);
  END LOOP;

  RETURN v_completion_id;
END;
$$;
