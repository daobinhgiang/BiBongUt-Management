-- Tighten RLS policies now that join/create use SECURITY DEFINER functions
-- Reverts the overly-permissive changes from migration 100400

-- 1. family_invites SELECT: back to family members only
--    (join_family_with_invite bypasses RLS, no need for public access)
DROP POLICY family_invites_select ON public.family_invites;
CREATE POLICY family_invites_select ON public.family_invites
  FOR SELECT USING (is_family_member(family_id));

-- 2. family_members INSERT: remove invite branch
--    (join_family_with_invite is SECURITY DEFINER, bypasses RLS)
DROP POLICY family_members_insert ON public.family_members;
CREATE POLICY family_members_insert ON public.family_members
  FOR INSERT
  WITH CHECK (
    -- Parents can add members
    is_family_parent(family_id)
    OR
    -- Family creator can bootstrap themselves as first parent
    (
      user_id = auth.uid()
      AND role = 'parent'
      AND EXISTS (
        SELECT 1 FROM public.families
        WHERE id = family_id AND created_by = auth.uid()
      )
    )
  );
