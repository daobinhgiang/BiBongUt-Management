-- Set admin user's role
UPDATE public.family_members
   SET role = 'admin'
 WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@bibongut.app');

-- Update my_family_ids() to return ALL families for admin users
CREATE OR REPLACE FUNCTION public.my_family_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    THEN (SELECT id FROM public.families)
    ELSE (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
  END;
$$;
