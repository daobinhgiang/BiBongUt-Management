-- Allow challenge creators (including children) to delete their own challenges
drop policy if exists challenges_delete on public.challenges;
create policy challenges_delete on public.challenges for delete
  using (
    is_family_parent(family_id)
    or created_by in (
      select fm.id from public.family_members fm where fm.user_id = auth.uid()
    )
  );
