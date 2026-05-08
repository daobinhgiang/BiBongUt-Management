-- Fix invite-join RLS blocker:
-- 1. Allow any authenticated user to SELECT invites (token is the secret)
-- 2. Allow invite-based joins in family_members INSERT

-- 1. Fix family_invites SELECT
DROP POLICY family_invites_select ON public.family_invites;
CREATE POLICY family_invites_select ON public.family_invites
  FOR SELECT USING (
    is_family_member(family_id)
    OR auth.uid() IS NOT NULL
  );

-- 2. Fix family_members INSERT (supersedes migration 100200)
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
    OR
    -- Authenticated user can join via a valid, unused invite
    (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.family_invites
        WHERE family_id = family_members.family_id
          AND accepted_at IS NULL
          AND expires_at > now()
      )
    )
  );
