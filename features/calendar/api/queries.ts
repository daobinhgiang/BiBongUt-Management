import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import type { EventWithAttendees } from "../types";

const EVENT_SELECT =
  "*, creator:family_members!calendar_events_created_by_fkey(id, nickname), event_attendees(*, family_member:family_members!event_attendees_family_member_id_fkey(id, nickname))";

export const eventKeys = {
  month: (familyId: string, month: string) =>
    ["events", familyId, month] as const,
  detail: (eventId: string) => ["events", "detail", eventId] as const,
  upcoming: (familyId: string) => ["events", "upcoming", familyId] as const,
};

async function fetchMonthEvents(
  familyId: string,
  month: string,
): Promise<EventWithAttendees[]> {
  const start = `${month}-01T00:00:00`;
  const lastDay = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0,
  ).getDate();
  const end = `${month}-${String(lastDay).padStart(2, "0")}T23:59:59`;

  const { data, error } = await supabase
    .from("calendar_events")
    .select(EVENT_SELECT)
    .eq("family_id", familyId)
    .gte("start_at", start)
    .lte("start_at", end)
    .order("start_at", { ascending: true });

  if (error) throw error;
  return data as unknown as EventWithAttendees[];
}

async function fetchEvent(eventId: string): Promise<EventWithAttendees> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select(EVENT_SELECT)
    .eq("id", eventId)
    .single();

  if (error) throw error;
  return data as unknown as EventWithAttendees;
}

async function fetchUpcomingEvents(
  familyId: string,
): Promise<EventWithAttendees[]> {
  const now = new Date().toISOString();
  const weekLater = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("calendar_events")
    .select(EVENT_SELECT)
    .eq("family_id", familyId)
    .gte("start_at", now)
    .lte("start_at", weekLater)
    .order("start_at", { ascending: true })
    .limit(10);

  if (error) throw error;
  return data as unknown as EventWithAttendees[];
}

export function useMonthEvents(month: string) {
  const { data: member } = useCurrentMember();

  return useQuery({
    queryKey: eventKeys.month(member?.family_id ?? "", month),
    queryFn: () => fetchMonthEvents(member!.family_id, month),
    enabled: !!member?.family_id,
  });
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => fetchEvent(eventId),
    enabled: !!eventId,
  });
}

export function useUpcomingEvents() {
  const { data: member } = useCurrentMember();

  return useQuery({
    queryKey: eventKeys.upcoming(member?.family_id ?? ""),
    queryFn: () => fetchUpcomingEvents(member!.family_id),
    enabled: !!member?.family_id,
  });
}
