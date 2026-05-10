import { Pressable, Text, View } from "react-native";
import { Users } from "phosphor-react-native";
import type { EventWithAttendees } from "../types";

type Props = {
  event: EventWithAttendees;
  onPress?: () => void;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function EventCard({ event, onPress }: Props) {
  const timeLabel = event.all_day
    ? "All day"
    : `${formatTime(event.start_at)} - ${formatTime(event.end_at)}`;

  return (
    <Pressable
      className="flex-row items-center rounded-2xl bg-white px-4 py-3 shadow-sm"
      onPress={onPress}
    >
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">
          {event.title}
        </Text>
        <Text className="text-sm text-gray-500">{timeLabel}</Text>
      </View>
      {event.event_attendees.length > 0 ? (
        <View className="flex-row items-center gap-1 rounded-full bg-bark-100 px-2 py-1">
          <Users size={14} color="#6b7a54" />
          <Text className="text-xs font-medium text-gray-600">
            {event.event_attendees.length}
          </Text>
        </View>
      ) : (
        <View className="rounded-full bg-gray-100 px-2 py-1">
          <Text className="text-xs font-medium text-gray-400">Unassigned</Text>
        </View>
      )}
    </Pressable>
  );
}
