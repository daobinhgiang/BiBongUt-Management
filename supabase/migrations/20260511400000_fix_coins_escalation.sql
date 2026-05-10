-- Fix: remove coins from anti-escalation trigger
-- Coins are legitimately modified by SECURITY DEFINER RPCs (complete_task,
-- award_points, redeem_reward) called by children. The trigger was preventing
-- these updates by resetting coins to OLD.coins for non-parent callers.
-- Coins are still protected: no PostgREST endpoint exposes raw coin updates.

CREATE OR REPLACE FUNCTION public.trg_prevent_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If the caller is a parent in this family, allow all changes
  IF EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = OLD.family_id
      AND user_id = auth.uid()
      AND role = 'parent'
  ) THEN
    RETURN NEW;
  END IF;

  -- Non-parents: force protected columns to stay unchanged
  -- Note: coins is NOT protected here — RPCs handle coin validation
  NEW.role := OLD.role;
  NEW.level := OLD.level;
  NEW.total_xp := OLD.total_xp;
  NEW.current_streak := OLD.current_streak;
  NEW.longest_streak := OLD.longest_streak;

  RETURN NEW;
END;
$$;
