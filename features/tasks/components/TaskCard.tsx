import { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import {
  User,
  CalendarBlank,
  Warning,
  ArrowsClockwise,
  Lightning,
  CoinVertical,
  Check,
  GlobeHemisphereWest,
  UsersThree,
} from "phosphor-react-native";
import {
  isOverdue as checkOverdue,
  formatDeadlineLocal,
  type TaskWithAssignee,
} from "../types";

type Props = {
  task: TaskWithAssignee;
  onPress: () => void;
  onComplete: (origin?: { x: number; y: number }) => void;
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
  const checkboxRef = useRef<View>(null);
  const creatorTz = task.creator_tz ?? "UTC";
  const overdue = checkOverdue(task.due_date, creatorTz);
  const deadlineLocal = task.due_date
    ? formatDeadlineLocal(task.due_date, creatorTz)
    : null;
  const isAnyone = !task.assignee_id;
  const isDailyHabit = task.task_type === "daily_habit";
  const showAssignee = showAssigneeAndDeadline && task.assignee;
  const showDueDate = showAssigneeAndDeadline && task.due_date;
  const showTimezone = showAssigneeAndDeadline && deadlineLocal;
  const showRecurrence =
    task.recurrence !== "none" && !isDailyHabit;
  const hasMetadata =
    showAssignee || showDueDate || showTimezone || showRecurrence;

  const handleComplete = () => {
    if (checkboxRef.current) {
      checkboxRef.current.measureInWindow((x, y, width, height) => {
        onComplete({ x: x + width / 2, y: y + height / 2 });
      });
    } else {
      onComplete();
    }
  };

  return (
    <Pressable
      className="flex-row items-center gap-3.5 rounded-3xl border border-bark-50 bg-white px-5 py-5 shadow-sm"
      onPress={onPress}
    >
      {/* Content */}
      <View className="flex-1 gap-1.5">
        <Text className="text-lg font-semibold text-gray-900">
          {task.title}
        </Text>

        {subtitle && (
          <Text className="text-sm text-jungle-600">{subtitle}</Text>
        )}

        {isAnyone && (
          <View className="flex-row items-center gap-1">
            <UsersThree size={14} color="#819067" />
            <Text className="text-sm font-medium text-jungle-600">
              Anyone
            </Text>
          </View>
        )}

        {hasMetadata && (
          <View className="flex-row flex-wrap items-center gap-2.5">
            {showAssignee && (
              <View className="flex-row items-center gap-1">
                <User size={14} color="#6b7280" />
                <Text className="text-sm text-gray-500">
                  {task.assignee!.nickname}
                </Text>
              </View>
            )}

            {showDueDate && (
              <View className="flex-row items-center gap-1">
                {overdue ? (
                  <Warning size={14} color="#ef4444" weight="fill" />
                ) : (
                  <CalendarBlank size={14} color="#9ca3af" />
                )}
                <Text
                  className={`text-sm ${overdue ? "font-semibold text-red-500" : "text-gray-400"}`}
                >
                  {overdue
                    ? "Overdue"
                    : new Date(`${task.due_date}T12:00:00`).toLocaleDateString()}
                </Text>
              </View>
            )}

            {showTimezone && (
              <View className="flex-row items-center gap-1">
                <GlobeHemisphereWest size={14} color="#6b7280" />
                <Text className="text-sm text-gray-400">
                  Due by {deadlineLocal}
                </Text>
              </View>
            )}

            {showRecurrence && <ArrowsClockwise size={14} color="#9ca3af" />}
          </View>
        )}
      </View>

      {/* Reward badge — XP for daily habits, coins for regular tasks */}
      <View className="items-end gap-1">
        {isDailyHabit ? (
          <View className="flex-row items-center gap-1">
            <Lightning size={16} color="#819067" weight="fill" />
            <Text className="text-base font-semibold text-jungle-600">
              {task.points} XP
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1">
            <CoinVertical size={16} color="#d97706" weight="fill" />
            <Text className="text-base font-semibold text-amber-700">
              {task.coins_reward}
            </Text>
          </View>
        )}
      </View>

      {/* Checkmark button */}
      {canComplete && (
        <Pressable
          className={`h-10 w-10 items-center justify-center rounded-xl border-2 ${
            isCompleting
              ? "border-jungle-400 bg-jungle-400"
              : "border-bark-200 bg-bark-50"
          }`}
          onPress={handleComplete}
          disabled={isCompleting}
          hitSlop={8}
        >
          <View ref={checkboxRef} collapsable={false}>
            <Check
              size={20}
              color={isCompleting ? "#fff" : "#9ca3af"}
              weight="bold"
            />
          </View>
        </Pressable>
      )}
    </Pressable>
  );
}
