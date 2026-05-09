import { Pressable, Text, View } from "react-native";
import type { TaskWithAssignee } from "../types";

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
  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());

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
        {isCompleting && (
          <Text className="text-xs font-bold text-white">✓</Text>
        )}
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

          {/* Assignee */}
          {task.assignee && (
            <Text className="text-xs text-gray-500">
              {task.assignee.nickname}
            </Text>
          )}

          {/* Due date */}
          {task.due_date && (
            <Text
              className={`text-xs ${isOverdue ? "font-semibold text-red-500" : "text-gray-400"}`}
            >
              {isOverdue ? "Overdue" : new Date(task.due_date).toLocaleDateString()}
            </Text>
          )}

          {/* Recurrence indicator */}
          {task.recurrence !== "none" && (
            <Text className="text-xs text-gray-400">↻</Text>
          )}
        </View>
      </View>

      {/* Points preview */}
      <View className="items-end">
        <Text className="text-sm font-semibold text-blue-600">
          {task.points} XP
        </Text>
        <Text className="text-xs text-yellow-600">
          {task.coins_reward} coins
        </Text>
      </View>
    </Pressable>
  );
}
