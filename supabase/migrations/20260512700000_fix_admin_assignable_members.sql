-- Admin users must not appear in assignment pickers even if family_members.role is wrong.
-- Sync role from auth metadata and expose assignable members via RPC + DB guards.

-- 1. Ensure admin accounts use family_role = 'admin'
UPDATE public.family_members fm
   SET role = 'admin'
  FROM auth.users u
 WHERE fm.user_id = u.id
   AND COALESCE((u.raw_app_meta_data->>'is_admin')::boolean, false) = true
   AND fm.role <> 'admin';

-- 2. Helper: can this member be assigned tasks/chores/events?
CREATE OR REPLACE FUNCTION public.is_assignable_family_member(p_member_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (
      SELECT fm.role <> 'admin'
         AND NOT COALESCE((u.raw_app_meta_data->>'is_admin')::boolean, false)
      FROM public.family_members fm
      LEFT JOIN auth.users u ON u.id = fm.user_id
      WHERE fm.id = p_member_id
    ),
    false
  );
$$;

-- 3. RPC for UI member pickers (tasks, chore charts, calendar, challenges, etc.)
CREATE OR REPLACE FUNCTION public.get_assignable_family_members(p_family_id uuid)
RETURNS TABLE (
  id uuid,
  nickname text,
  role public.family_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT fm.id, fm.nickname, fm.role
  FROM public.family_members fm
  LEFT JOIN auth.users u ON u.id = fm.user_id
  WHERE fm.family_id = p_family_id
    AND fm.family_id IN (SELECT public.my_family_ids())
    AND fm.role <> 'admin'
    AND NOT COALESCE((u.raw_app_meta_data->>'is_admin')::boolean, false)
  ORDER BY fm.nickname;
$$;

GRANT EXECUTE ON FUNCTION public.is_assignable_family_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_assignable_family_members(uuid) TO authenticated;

-- 4. Reject direct DB writes that assign admin to work items
CREATE OR REPLACE FUNCTION public.trg_reject_non_assignable_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_ARGV[0] = 'assignee_id' THEN
    IF NEW.assignee_id IS NOT NULL
       AND NOT public.is_assignable_family_member(NEW.assignee_id) THEN
      RAISE EXCEPTION 'This member cannot be assigned tasks or chores';
    END IF;
  ELSIF TG_ARGV[0] = 'family_member_id' THEN
    IF NEW.family_member_id IS NOT NULL
       AND NOT public.is_assignable_family_member(NEW.family_member_id) THEN
      RAISE EXCEPTION 'This member cannot be assigned tasks or chores';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_non_assignable_task_assignee ON public.tasks;
CREATE TRIGGER reject_non_assignable_task_assignee
  BEFORE INSERT OR UPDATE OF assignee_id ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reject_non_assignable_member('assignee_id');

DROP TRIGGER IF EXISTS reject_non_assignable_chore_slot ON public.chore_chart_slots;
CREATE TRIGGER reject_non_assignable_chore_slot
  BEFORE INSERT OR UPDATE OF assignee_id ON public.chore_chart_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reject_non_assignable_member('assignee_id');

DROP TRIGGER IF EXISTS reject_non_assignable_event_attendee ON public.event_attendees;
CREATE TRIGGER reject_non_assignable_event_attendee
  BEFORE INSERT OR UPDATE OF family_member_id ON public.event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reject_non_assignable_member('family_member_id');

DROP TRIGGER IF EXISTS reject_non_assignable_challenge_participant ON public.challenge_participants;
CREATE TRIGGER reject_non_assignable_challenge_participant
  BEFORE INSERT OR UPDATE OF family_member_id ON public.challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reject_non_assignable_member('family_member_id');
