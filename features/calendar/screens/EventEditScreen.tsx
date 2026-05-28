import { ActivityIndicator, Alert, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { useEvent } from "../api/queries";
import { useUpdateEvent } from "../api/mutations";
import { EventForm } from "../components/EventForm";
import type { CreateEventFormValues } from "../schemas";

export function EventEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: member } = useCurrentMember();
  const { data: event, isLoading } = useEvent(id);
  const updateEvent = useUpdateEvent();

  if (isLoading || !event) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleSubmit = (values: CreateEventFormValues) => {
    const startAt = values.all_day
      ? new Date(new Date(values.start_at).setHours(0, 0, 0, 0)).toISOString()
      : values.start_at;
    const endAt = values.all_day
      ? new Date(new Date(values.end_at).setHours(23, 59, 59, 0)).toISOString()
      : values.end_at;

    updateEvent.mutate(
      {
        eventId: event.id,
        updates: {
          title: values.title,
          description: values.description || null,
          start_at: startAt,
          end_at: endAt,
          all_day: values.all_day,
        },
        attendee_ids: values.attendee_ids,
      },
      {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not update event"),
      },
    );
  };

  return (
    <EventForm
      onSubmit={handleSubmit}
      isPending={updateEvent.isPending}
      familyId={member?.family_id}
      initialValues={{
        title: event.title,
        description: event.description ?? "",
        start_at: event.start_at,
        end_at: event.end_at,
        all_day: event.all_day,
        attendee_ids: event.event_attendees.map((a) => a.family_member_id),
      }}
      submitLabel="Save Changes"
    />
  );
}
