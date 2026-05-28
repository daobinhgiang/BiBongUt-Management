import { Pressable, Text, View } from "react-native";
import {
  User,
  CalendarBlank,
  Warning,
  ArrowsClockwise,
  Lightning,
  CurrencyCircleDollar,
  Check,
  GlobeHemisphereWest,
} from "phosphor-react-native";
import {
  isOverdue as checkOverdue,
  formatDeadlineLocal,
  type TaskWithAssignee,
} from "../types";

type Props = {
  task: TaskWithAssignee;
  onPress: () => void;
  onComplete: () => void;
  isCompleting: boolean;
  canComplete?: boolean;
  subtitle?: string;
  showAssigneeAndDeadline?: boolean;
};

export function TaskCard({
  task,
  onPress,
  onComplete,
  isCompleting,
  canComplete = true,
  subtitle,
  showAssigneeAndDeadline = true,
}: Props) {
  const creatorTz = task.creator_tz ?? "UTC";
  const overdue = checkOverdue(task.due_date, creatorTz);
  const deadlineLocal = task.due_date
    ? formatDeadlineLocal(task.due_date, creatorTz)
    : null;
  const showAssignee = showAssigneeAndDeadline && task.assignee;
  const showDueDate = showAssigneeAndDeadline && task.due_date;
  const showTimezone = showAssigneeAndDeadline && deadlineLocal;
  const showRecurrence = task.recurrence !== "none";
  const hasMetadata =
    showAssignee || showDueDate || showTimezone || showRecurrence;

  return (
    <Pressable
      className="flex-row items-center gap-3 rounded-2xl border border-bark-50 bg-white p-4 shadow-sm"
      onPress={onPress}
    >
      {/* Content */}
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-gray-900">
          {task.title}
        </Text>

        {subtitle && (
          <Text className="text-xs text-jungle-600">{subtitle}</Text>
        )}

        {hasMetadata && (
          <View className="flex-row flex-wrap items-center gap-2">
            {showAssignee && (
              <View className="flex-row items-center gap-0.5">
                <User size={12} color="#6b7280" />
                <Text className="text-xs text-gray-500">
                  {task.assignee!.nickname}
                </Text>
              </View>
            )}

            {showDueDate && (
              <View className="flex-row items-center gap-0.5">
                {overdue ? (
                  <Warning size={12} color="#ef4444" weight="fill" />
                ) : (
                  <CalendarBlank size={12} color="#9ca3af" />
                )}
                <Text
                  className={`text-xs ${overdue ? "font-semibold text-red-500" : "text-gray-400"}`}
                >
                  {overdue
                    ? "Overdue"
                    : new Date(`${task.due_date}T12:00:00`).toLocaleDateString()}
                </Text>
              </View>
            )}

            {showTimezone && (
              <View className="flex-row items-center gap-0.5">
                <GlobeHemisphereWest size={12} color="#6b7280" />
                <Text className="text-xs text-gray-400">
                  Due by {deadlineLocal}
                </Text>
              </View>
            )}

            {showRecurrence && <ArrowsClockwise size={12} color="#9ca3af" />}
          </View>
        )}
      </View>

      {/* Points preview */}
      <View className="items-end gap-1">
        <View className="flex-row items-center gap-0.5">
          <Lightning size={14} color="#819067" weight="fill" />
          <Text className="text-sm font-semibold text-jungle-600">
            {task.points} XP
          </Text>
        </View>
        <View className="flex-row items-center gap-0.5">
          <CurrencyCircleDollar size={12} color="#807200" />
          <Text className="text-xs font-medium text-bark-500">
            {task.coins_reward}
          </Text>
        </View>
      </View>

      {/* Checkmark button */}
      {canComplete && (
        <Pressable
          className={`h-9 w-9 items-center justify-center rounded-lg border-2 ${
            isCompleting
              ? "border-jungle-400 bg-jungle-400"
              : "border-bark-200 bg-bark-50"
          }`}
          onPress={onComplete}
          disabled={isCompleting}
          hitSlop={8}
        >
          <Check
            size={18}
            color={isCompleting ? "#fff" : "#9ca3af"}
            weight="bold"
          />
        </Pressable>
      )}
    </Pressable>
  );
}
