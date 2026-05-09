import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useTask, useTaskCompletions } from "../api/queries";
import { useCompleteTask } from "../api/mutations";
import type { TaskCompletionWithMember } from "../types";

const DIFFICULTY_LABEL = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
} as const;

export function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: task, isLoading } = useTask(id);
  const { data: completions } = useTaskCompletions(id);
  const completeTask = useCompleteTask();

  if (isLoading || !task) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());

  const handleComplete = () => {
    if (!family) return;
    completeTask.mutate(
      { task, memberId: family.id },
      {
        onSuccess: (result) => {
          Alert.alert(
            "Task Complete!",
            `+${result.points} XP, +${result.coins} coins`,
            [{ text: "OK", onPress: () => router.back() }],
          );
        },
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not complete task"),
      },
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-4 py-6 gap-5"
    >
      {/* Header */}
      <View className="gap-1">
        <Text className="text-2xl font-bold text-gray-900">{task.title}</Text>
        {task.description && (
          <Text className="text-base text-gray-600">{task.description}</Text>
        )}
      </View>

      {/* Meta */}
      <View className="flex-row flex-wrap gap-3">
        <MetaChip label={DIFFICULTY_LABEL[task.difficulty]} />
        <MetaChip label={`${task.points} XP`} />
        <MetaChip label={`${task.coins_reward} coins`} />
        {task.assignee && <MetaChip label={task.assignee.nickname} />}
        {task.recurrence !== "none" && (
          <MetaChip label={`↻ ${task.recurrence}`} />
        )}
        {task.due_date && (
          <MetaChip
            label={
              isOverdue
                ? `Overdue: ${task.due_date}`
                : `Due: ${task.due_date}`
            }
            variant={isOverdue ? "danger" : "default"}
          />
        )}
      </View>

      {/* Complete button */}
      {task.is_active && (
        <Pressable
          className={`rounded-lg py-3 ${
            completeTask.isPending ? "bg-green-400" : "bg-green-600"
          }`}
          onPress={handleComplete}
          disabled={completeTask.isPending}
        >
          <Text className="text-center text-base font-semibold text-white">
            {completeTask.isPending ? "Completing..." : "Mark Complete"}
          </Text>
        </Pressable>
      )}

      {/* Completion history */}
      {completions && completions.length > 0 && (
        <View className="gap-2">
          <Text className="text-lg font-semibold text-gray-900">
            Completion History
          </Text>
          {completions.map((c: TaskCompletionWithMember) => (
            <View
              key={c.id}
              className="flex-row items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
            >
              <Text className="text-sm text-gray-700">
                {c.completed_by_member?.nickname ?? "Unknown"}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-blue-600">
                  +{c.points_awarded} XP
                </Text>
                <Text className="text-xs text-gray-400">
                  {new Date(c.completed_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function MetaChip({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "danger";
}) {
  return (
    <View
      className={`rounded-full px-3 py-1 ${
        variant === "danger" ? "bg-red-100" : "bg-gray-100"
      }`}
    >
      <Text
        className={`text-xs font-medium ${
          variant === "danger" ? "text-red-700" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}
