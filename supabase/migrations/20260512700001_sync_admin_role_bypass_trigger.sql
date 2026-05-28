-- prevent_self_escalation blocks role changes when auth.uid() is null (migrations/service role).
-- Sync admin role with trigger temporarily disabled.
ALTER TABLE public.family_members DISABLE TRIGGER prevent_self_escalation;

UPDATE public.family_members fm
   SET role = 'admin'
  FROM auth.users u
 WHERE fm.user_id = u.id
   AND COALESCE((u.raw_app_meta_data->>'is_admin')::boolean, false) = true
   AND fm.role <> 'admin';

ALTER TABLE public.family_members ENABLE TRIGGER prevent_self_escalation;
