-- Fix chicken-and-egg: allow family creator to insert themselves as first member
DROP POLICY family_members_insert ON public.family_members;

CREATE POLICY family_members_insert ON public.family_members
  FOR INSERT
  WITH CHECK (
    -- Parents can add members
    is_family_parent(family_id)
    OR
    -- Family creator can add themselves (first member bootstrap)
    (
      user_id = auth.uid()
      AND role = 'parent'
      AND EXISTS (
        SELECT 1 FROM public.families
        WHERE id = family_id
          AND created_by = auth.uid()
      )
    )
  );
