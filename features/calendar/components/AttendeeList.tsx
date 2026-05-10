import { Pressable, Text, View } from "react-native";
import { CheckCircle, Question, XCircle } from "phosphor-react-native";
import type { AttendanceStatus, EventWithAttendees } from "../types";

type Props = {
  event: EventWithAttendees;
  currentMemberId: string | undefined;
  onRsvp: (status: AttendanceStatus) => void;
};

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { icon: typeof CheckCircle; color: string; label: string }
> = {
  going: { icon: CheckCircle, color: "#16a34a", label: "Going" },
  maybe: { icon: Question, color: "#ca8a04", label: "Maybe" },
  declined: { icon: XCircle, color: "#dc2626", label: "Can't" },
};

const RSVP_OPTIONS: AttendanceStatus[] = ["going", "maybe", "declined"];

export function AttendeeList({ event, currentMemberId, onRsvp }: Props) {
  const currentAttendee = event.event_attendees.find(
    (a) => a.family_member_id === currentMemberId,
  );

  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-gray-900">Attendees</Text>

      {event.event_attendees.map((attendee) => {
        const cfg = STATUS_CONFIG[attendee.status];
        const Icon = cfg.icon;
        const isCurrentUser = attendee.family_member_id === currentMemberId;

        return (
          <View
            key={attendee.id}
            className="flex-row items-center justify-between rounded-lg bg-bark-50 px-3 py-2"
          >
            <Text className="text-sm text-gray-700">
              {attendee.family_member.nickname}
              {isCurrentUser ? " (you)" : ""}
            </Text>
            <View className="flex-row items-center gap-1">
              <Icon size={16} color={cfg.color} weight="fill" />
              <Text className="text-xs font-medium" style={{ color: cfg.color }}>
                {cfg.label}
              </Text>
            </View>
          </View>
        );
      })}

      {/* RSVP buttons for current user */}
      {currentMemberId && (
        <View className="flex-row gap-2">
          {RSVP_OPTIONS.map((status) => {
            const isActive = currentAttendee?.status === status;
            const cfg = STATUS_CONFIG[status];
            return (
              <Pressable
                key={status}
                className={`flex-1 items-center rounded-lg py-2 ${
                  isActive ? "bg-jungle-500" : "bg-bark-100"
                }`}
                onPress={() => onRsvp(status)}
              >
                <Text
                  className={`text-sm font-medium ${
                    isActive ? "text-white" : "text-gray-700"
                  }`}
                >
                  {cfg.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
