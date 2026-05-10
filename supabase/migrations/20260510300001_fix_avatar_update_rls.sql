-- Fix: avatar upload 500 for child accounts
-- The old WITH CHECK on family_members_update_self used subqueries on the same
-- table being updated, which caused PostgREST to return 500 on PATCH.
-- Replace with a simple policy + BEFORE UPDATE trigger for anti-escalation.

DROP POLICY IF EXISTS family_members_update_self ON public.family_members;
CREATE POLICY family_members_update_self ON public.family_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Prevent self-escalation via trigger instead of RLS
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
  NEW.role := OLD.role;
  NEW.level := OLD.level;
  NEW.total_xp := OLD.total_xp;
  NEW.coins := OLD.coins;
  NEW.current_streak := OLD.current_streak;
  NEW.longest_streak := OLD.longest_streak;

  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_self_escalation
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_prevent_self_escalation();
