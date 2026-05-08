-- Fix: allow family creator to SELECT their family immediately after INSERT
-- Without this, INSERT...RETURNING fails because the SELECT policy blocks it
-- (no family_members row exists yet at INSERT time)
DROP POLICY families_select ON public.families;

CREATE POLICY families_select ON public.families
  FOR SELECT
  USING (
    -- Family members can see their families
    id IN (SELECT my_family_ids())
    OR
    -- Creator can see their own family (needed for INSERT...RETURNING)
    created_by = auth.uid()
  );
