import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useTasks, useCompletedTasks } from "../api/queries";
import { useCompleteTask } from "../api/mutations";
import { TaskCard } from "../components/TaskCard";
import { TaskFilterBar } from "../components/TaskFilterBar";
import { XpToast } from "../components/XpToast";
import { localToday, type TaskFilter, type TaskWithAssignee } from "../types";

function filterTasks(
  tasks: TaskWithAssignee[],
  filter: TaskFilter,
  myMemberId: string | undefined,
): TaskWithAssignee[] {
  const today = localToday();

  switch (filter) {
    case "mine":
      return tasks.filter((t) => t.assignee_id === myMemberId);
    case "today":
      return tasks.filter((t) => t.due_date === today);
    case "overdue":
      return tasks.filter(
        (t) => t.due_date != null && t.due_date < today,
      );
    default:
      return tasks;
  }
}

export function TaskListScreen() {
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: tasks, isLoading } = useTasks();
  const { data: completedTasks, isLoading: isLoadingDone } = useCompletedTasks();
  const completeTask = useCompleteTask();
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [toast, setToast] = useState<{ points: number; coins: number } | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const isDoneFilter = filter === "done";
  const sourceData = isDoneFilter ? completedTasks : tasks;

  const filtered = useMemo(
    () =>
      isDoneFilter
        ? (completedTasks ?? [])
        : filterTasks(tasks ?? [], filter, family?.id),
    [tasks, completedTasks, filter, family?.id, isDoneFilter],
  );

  if (isLoading || (isDoneFilter && isLoadingDone)) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <TaskFilterBar active={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl">📋</Text>
          <Text className="mt-3 text-center text-base font-medium text-gray-500">
            {isDoneFilter
              ? "No completed tasks yet."
              : (sourceData?.length ?? 0) === 0
                ? "No tasks yet. Tap + to create one."
                : "Nothing matches that filter."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-2 px-4 pb-24"
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => router.push(`/(app)/tasks/${item.id}`)}
              onComplete={() => {
                if (!family || isDoneFilter) return;
                completeTask.mutate(
                  { task: item, memberId: family.id },
                  {
                    onSuccess: (result) => setToast(result),
                  },
                );
              }}
              isCompleting={
                !isDoneFilter &&
                completeTask.isPending &&
                completeTask.variables?.task.id === item.id
              }
            />
          )}
        />
      )}

      <XpToast
        points={toast?.points ?? 0}
        coins={toast?.coins ?? 0}
        visible={toast !== null}
        onDismiss={dismissToast}
      />

      {/* FAB */}
      {family?.role === "parent" && (
        <Pressable
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg"
          onPress={() => router.push("/(app)/tasks/new")}
        >
          <Text className="text-2xl font-bold text-white">+</Text>
        </Pressable>
      )}
    </View>
  );
}
