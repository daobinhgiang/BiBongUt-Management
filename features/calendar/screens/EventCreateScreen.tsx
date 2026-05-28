import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { useCreateEvent } from "../api/mutations";
import { EventForm } from "../components/EventForm";
import type { CreateEventFormValues } from "../schemas";

export function EventCreateScreen() {
  const router = useRouter();
  const { data: member } = useCurrentMember();
  const createEvent = useCreateEvent();

  const handleSubmit = (values: CreateEventFormValues) => {
    if (!member) return;

    const startAt = values.all_day
      ? new Date(new Date(values.start_at).setHours(0, 0, 0, 0)).toISOString()
      : values.start_at;
    const endAt = values.all_day
      ? new Date(new Date(values.end_at).setHours(23, 59, 59, 0)).toISOString()
      : values.end_at;

    createEvent.mutate(
      {
        event: {
          title: values.title,
          description: values.description || null,
          start_at: startAt,
          end_at: endAt,
          all_day: values.all_day,
          family_id: member.family_id,
          created_by: member.id,
        },
        attendee_ids: values.attendee_ids,
      },
      {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not create event"),
      },
    );
  };

  return (
    <EventForm
      onSubmit={handleSubmit}
      isPending={createEvent.isPending}
      familyId={member?.family_id}
    />
  );
}
