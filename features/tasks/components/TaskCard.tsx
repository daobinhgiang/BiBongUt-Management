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

const DIFFICULTY_COLORS = {
  easy: { bg: "bg-jungle-100", text: "text-jungle-700" },
  medium: { bg: "bg-bark-100", text: "text-bark-600" },
  hard: { bg: "bg-red-100", text: "text-red-700" },
} as const;

type Props = {
  task: TaskWithAssignee;
  onPress: () => void;
  onComplete: () => void;
  isCompleting: boolean;
  canComplete?: boolean;
  subtitle?: string;
};

export function TaskCard({
  task,
  onPress,
  onComplete,
  isCompleting,
  canComplete = true,
  subtitle,
}: Props) {
  const creatorTz = task.creator_tz ?? "UTC";
  const overdue = checkOverdue(task.due_date, creatorTz);
  const deadlineLocal = task.due_date
    ? formatDeadlineLocal(task.due_date, creatorTz)
    : null;

  return (
    <Pressable
      className="flex-row items-center gap-3 rounded-2xl border border-bark-50 bg-white p-4 shadow-sm"
      onPress={onPress}
    >
      {/* Checkbox */}
      {canComplete && (
        <Pressable
          className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
            isCompleting
              ? "border-jungle-400 bg-jungle-400"
              : "border-bark-200"
          }`}
          onPress={onComplete}
          disabled={isCompleting}
          hitSlop={8}
        >
          {isCompleting && <Check size={14} color="#fff" weight="bold" />}
        </Pressable>
      )}

      {/* Content */}
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-gray-900">
          {task.title}
        </Text>

        {subtitle && (
          <Text className="text-xs text-jungle-600">{subtitle}</Text>
        )}

        <View className="flex-row flex-wrap items-center gap-2">
          {/* Difficulty badge */}
          <View
            className={`rounded-full px-2 py-0.5 ${DIFFICULTY_COLORS[task.difficulty].bg}`}
          >
            <Text
              className={`text-xs font-medium capitalize ${DIFFICULTY_COLORS[task.difficulty].text}`}
            >
              {task.difficulty}
            </Text>
          </View>

          {/* Assignee */}
          {task.assignee && (
            <View className="flex-row items-center gap-0.5">
              <User size={12} color="#6b7280" />
              <Text className="text-xs text-gray-500">
                {task.assignee.nickname}
              </Text>
            </View>
          )}

          {/* Due date */}
          {task.due_date && (
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

          {/* Timezone indicator — only if creator and viewer are in different timezones */}
          {deadlineLocal && (
            <View className="flex-row items-center gap-0.5">
              <GlobeHemisphereWest size={12} color="#6b7280" />
              <Text className="text-xs text-gray-400">
                Due by {deadlineLocal}
              </Text>
            </View>
          )}

          {/* Recurrence indicator */}
          {task.recurrence !== "none" && (
            <ArrowsClockwise size={12} color="#9ca3af" />
          )}
        </View>
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
    </Pressable>
  );
}
