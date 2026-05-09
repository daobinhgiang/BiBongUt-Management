import { Pressable, Text, View } from "react-native";
import {
  User,
  PencilLine,
  CalendarBlank,
  Warning,
  ArrowsClockwise,
  Lightning,
  CurrencyCircleDollar,
  Check,
} from "phosphor-react-native";
import { localToday, type TaskWithAssignee } from "../types";

const DIFFICULTY_COLORS = {
  easy: { bg: "bg-green-100", text: "text-green-700" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
  hard: { bg: "bg-red-100", text: "text-red-700" },
} as const;

type Props = {
  task: TaskWithAssignee;
  onPress: () => void;
  onComplete: () => void;
  isCompleting: boolean;
};

export function TaskCard({ task, onPress, onComplete, isCompleting }: Props) {
  const isOverdue = task.due_date != null && task.due_date < localToday();

  return (
    <Pressable
      className="flex-row items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
      onPress={onPress}
    >
      {/* Checkbox */}
      <Pressable
        className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
          isCompleting ? "border-blue-400 bg-blue-400" : "border-gray-300"
        }`}
        onPress={onComplete}
        disabled={isCompleting}
        hitSlop={8}
      >
        {isCompleting && <Check size={14} color="#fff" weight="bold" />}
      </Pressable>

      {/* Content */}
      <View className="flex-1 gap-1">
        <Text className="text-base font-medium text-gray-900">
          {task.title}
        </Text>
        <View className="flex-row items-center gap-2">
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

          {/* Creator (hidden when same as assignee) */}
          {task.creator.id !== task.assignee?.id && (
            <View className="flex-row items-center gap-0.5">
              <PencilLine size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-400">
                {task.creator.nickname}
              </Text>
            </View>
          )}

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
              {isOverdue ? (
                <Warning size={12} color="#ef4444" weight="fill" />
              ) : (
                <CalendarBlank size={12} color="#9ca3af" />
              )}
              <Text
                className={`text-xs ${isOverdue ? "font-semibold text-red-500" : "text-gray-400"}`}
              >
                {isOverdue
                  ? "Overdue"
                  : new Date(task.due_date).toLocaleDateString()}
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
      <View className="items-end">
        <View className="flex-row items-center gap-0.5">
          <Lightning size={14} color="#2563eb" weight="fill" />
          <Text className="text-sm font-semibold text-blue-600">
            {task.points} XP
          </Text>
        </View>
        <View className="flex-row items-center gap-0.5">
          <CurrencyCircleDollar size={12} color="#ca8a04" />
          <Text className="text-xs text-yellow-600">{task.coins_reward}</Text>
        </View>
      </View>
    </Pressable>
  );
}
