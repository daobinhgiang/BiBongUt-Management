-- Grant admin the same DB-level privileges as parent across all functions/triggers/policies
-- that currently check role = 'parent' without including 'admin'.

-- 1. trg_prevent_self_escalation: let admin bypass protected-column resets
CREATE OR REPLACE FUNCTION public.trg_prevent_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = OLD.family_id
      AND user_id = auth.uid()
      AND role IN ('parent', 'admin')
  ) THEN
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.level := OLD.level;
  NEW.total_xp := OLD.total_xp;
  NEW.current_streak := OLD.current_streak;
  NEW.longest_streak := OLD.longest_streak;

  RETURN NEW;
END;
$$;

-- 2. award_points: let admin award points
CREATE OR REPLACE FUNCTION public.award_points(
  p_member_id uuid,
  p_xp int,
  p_coins int,
  p_reason text,
  p_ref_table text DEFAULT NULL,
  p_ref_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_family_id uuid;
  v_new_xp int;
  v_new_level int;
BEGIN
  SELECT family_id INTO v_family_id
  FROM public.family_members WHERE id = p_member_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = v_family_id
      AND user_id = auth.uid()
      AND role IN ('parent', 'admin')
  ) THEN
    RAISE EXCEPTION 'only parents in the same family can award points';
  END IF;

  SELECT total_xp + p_xp INTO v_new_xp
  FROM public.family_members WHERE id = p_member_id;

  v_new_level := floor(sqrt(v_new_xp::numeric / 100)) + 1;

  UPDATE public.family_members SET
    total_xp = v_new_xp,
    coins = coins + p_coins,
    level = v_new_level
  WHERE id = p_member_id;

  INSERT INTO public.transactions (family_member_id, delta_xp, delta_coins, reason, ref_table, ref_id)
  VALUES (p_member_id, p_xp, p_coins, p_reason, p_ref_table, p_ref_id);
END;
$$;

-- 3. trg_notify_reward_redeemed: notify admin when a reward is redeemed
CREATE OR REPLACE FUNCTION public.trg_notify_reward_redeemed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reward record;
  v_redeemer_nickname text;
  v_parent record;
BEGIN
  SELECT * INTO v_reward
  FROM public.rewards WHERE id = NEW.reward_id;

  SELECT nickname INTO v_redeemer_nickname
  FROM public.family_members WHERE id = NEW.redeemed_by;

  FOR v_parent IN
    SELECT id FROM public.family_members
    WHERE family_id = v_reward.family_id
      AND role IN ('parent', 'admin')
      AND id <> NEW.redeemed_by
  LOOP
    INSERT INTO public.notifications (family_member_id, type, title, body, data)
    VALUES (
      v_parent.id,
      'reward_redeemed',
      'Reward Redeemed!',
      coalesce(v_redeemer_nickname, 'Someone') || ' redeemed: ' || v_reward.title,
      jsonb_build_object('screen', 'rewards', 'rewardId', NEW.reward_id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- 4. Badge RLS policies: let admin manage badges
DROP POLICY IF EXISTS badges_insert ON public.badges;
CREATE POLICY badges_insert ON public.badges FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = auth.uid() AND role IN ('parent', 'admin')
  ));

DROP POLICY IF EXISTS badges_update ON public.badges;
CREATE POLICY badges_update ON public.badges FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = auth.uid() AND role IN ('parent', 'admin')
  ));

DROP POLICY IF EXISTS badges_delete ON public.badges;
CREATE POLICY badges_delete ON public.badges FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = auth.uid() AND role IN ('parent', 'admin')
  ));
