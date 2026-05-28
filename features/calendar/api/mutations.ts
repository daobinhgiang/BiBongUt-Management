import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { eventKeys } from "./queries";
import type {
  CalendarEventInsert,
  CalendarEventUpdate,
  EventWithAttendees,
  AttendanceStatus,
} from "../types";

// ── Create event ──

type CreateEventInput = {
  event: CalendarEventInsert;
  attendee_ids: string[];
};

async function createEvent({ event, attendee_ids }: CreateEventInput) {
  const { data, error } = await supabase
    .from("calendar_events")
    .insert(event)
    .select("id")
    .single();

  if (error) throw error;

  if (attendee_ids.length > 0) {
    const { error: attError } = await supabase
      .from("event_attendees")
      .insert(
        attendee_ids.map((mid) => ({
          event_id: data.id,
          family_member_id: mid,
        })),
      );
    if (attError) throw attError;
  }

  return data;
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      if (!member?.family_id) return;
      qc.invalidateQueries({
        queryKey: ["events", member.family_id],
      });
    },
  });
}

// ── Update event ──

type UpdateEventInput = {
  eventId: string;
  updates: CalendarEventUpdate;
  attendee_ids: string[];
};

async function updateEvent({ eventId, updates, attendee_ids }: UpdateEventInput) {
  const { error } = await supabase
    .from("calendar_events")
    .update(updates)
    .eq("id", eventId);

  if (error) throw error;

  // Replace attendees: delete existing then re-insert
  const { error: delError } = await supabase
    .from("event_attendees")
    .delete()
    .eq("event_id", eventId);
  if (delError) throw delError;

  if (attendee_ids.length > 0) {
    const { error: attError } = await supabase
      .from("event_attendees")
      .insert(
        attendee_ids.map((mid) => ({
          event_id: eventId,
          family_member_id: mid,
        })),
      );
    if (attError) throw attError;
  }
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: updateEvent,
    onSuccess: (_data, { eventId }) => {
      if (!member?.family_id) return;
      qc.invalidateQueries({
        queryKey: ["events", member.family_id],
      });
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}

// ── Delete event ──

export function useDeleteEvent() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onMutate: async (eventId) => {
      if (!member?.family_id) return;
      // Optimistically remove from all month caches
      qc.setQueriesData<EventWithAttendees[]>(
        { queryKey: ["events", member.family_id] },
        (old) => old?.filter((e) => e.id !== eventId),
      );
    },
    onSettled: () => {
      if (!member?.family_id) return;
      qc.invalidateQueries({
        queryKey: ["events", member.family_id],
      });
    },
  });
}

// ── Update attendance (RSVP) ──

type UpdateAttendanceInput = {
  eventId: string;
  memberId: string;
  status: AttendanceStatus;
};

async function updateAttendance({
  eventId,
  memberId,
  status,
}: UpdateAttendanceInput) {
  const { error } = await supabase.from("event_attendees").upsert(
    {
      event_id: eventId,
      family_member_id: memberId,
      status,
    },
    { onConflict: "event_id,family_member_id" },
  );
  if (error) throw error;
}

export function useUpdateAttendance() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateAttendance,
    onSuccess: (_data, { eventId }) => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}
