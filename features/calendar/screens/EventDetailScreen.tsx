import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CalendarBlank,
  Clock,
  PencilLine,
  PencilSimple,
  Trash,
} from "phosphor-react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useEvent } from "../api/queries";
import { useDeleteEvent, useUpdateAttendance } from "../api/mutations";
import { AttendeeList } from "../components/AttendeeList";
import type { AttendanceStatus } from "../types";

export function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: event, isLoading } = useEvent(id);
  const deleteEvent = useDeleteEvent();
  const updateAttendance = useUpdateAttendance();

  if (isLoading || !event) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isCreator = event.created_by === family?.id;
  const isParent = family?.role === "parent";
  const canEdit = isCreator || isParent;

  const handleDelete = () => {
    Alert.alert(
      "Delete Event",
      `Delete "${event.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteEvent.mutate(event.id, {
              onSuccess: () => router.back(),
              onError: (err) =>
                Alert.alert("Error", err.message ?? "Could not delete event"),
            }),
        },
      ],
    );
  };

  const handleRsvp = (status: AttendanceStatus) => {
    if (!family) return;
    updateAttendance.mutate({ eventId: event.id, memberId: family.id, status });
  };

  const startDate = new Date(event.start_at);
  const endDate = new Date(event.end_at);

  return (
    <ScrollView
      className="flex-1 bg-bark-50"
      contentContainerClassName="px-4 py-6 gap-5"
    >
      {/* Header */}
      <View className="gap-1">
        <Text className="text-2xl font-bold text-gray-900">{event.title}</Text>
        {event.description && (
          <Text className="text-base text-gray-600">{event.description}</Text>
        )}
      </View>

      {/* Meta */}
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <CalendarBlank size={16} color="#6b7a54" />
          <Text className="text-sm text-gray-700">
            {event.all_day
              ? startDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              : startDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
          </Text>
        </View>
        {!event.all_day && (
          <View className="flex-row items-center gap-2">
            <Clock size={16} color="#6b7a54" />
            <Text className="text-sm text-gray-700">
              {startDate.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {endDate.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}
        <View className="flex-row items-center gap-2">
          <PencilLine size={16} color="#6b7a54" />
          <Text className="text-sm text-gray-700">
            Created by {event.creator.nickname}
          </Text>
        </View>
      </View>

      {/* Attendees */}
      {event.event_attendees.length > 0 && (
        <AttendeeList
          event={event}
          currentMemberId={family?.id}
          onRsvp={handleRsvp}
        />
      )}

      {/* Edit / Delete */}
      {canEdit && (
        <View className="flex-row gap-3">
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-jungle-500 py-3"
            onPress={() => router.push(`/(app)/calendar/${event.id}/edit`)}
          >
            <PencilSimple size={18} color="#819067" />
            <Text className="text-base font-semibold text-jungle-600">Edit</Text>
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-red-500 py-3"
            onPress={handleDelete}
          >
            <Trash size={18} color="#ef4444" />
            <Text className="text-base font-semibold text-red-500">Delete</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
