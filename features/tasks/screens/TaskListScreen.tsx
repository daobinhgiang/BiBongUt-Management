import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ClipboardText, PlusIcon } from "phosphor-react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useTasks, useCompletedTasks } from "../api/queries";
import { useCompleteTask, type CompleteTaskResult } from "../api/mutations";
import { TaskCard } from "../components/TaskCard";
import { TaskFilterBar } from "../components/TaskFilterBar";
import { XpToast } from "../components/XpToast";
import { LevelUpModal } from "@/features/gamification/components/LevelUpModal";
import { BadgeToast } from "@/features/gamification/components/BadgeToast";
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
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);
  const pendingCelebration = useRef<{ level: number | null; badge: string | null }>({ level: null, badge: null });
  const dismissToast = useCallback(() => {
    setToast(null);
    const { level, badge } = pendingCelebration.current;
    if (level) {
      setLevelUp(level);
      pendingCelebration.current.level = null;
    } else if (badge) {
      setBadgeToast(badge);
      pendingCelebration.current.badge = null;
    }
  }, []);

  const isDoneFilter = filter === "done";
  const sourceData = isDoneFilter ? completedTasks : tasks;

  const filtered = useMemo(
    () =>
      isDoneFilter
        ? (completedTasks ?? [])
        : filterTasks(tasks ?? [], filter, family?.id),
    [tasks, completedTasks, filter, family?.id, isDoneFilter],
  );

  const handleCompleteSuccess = useCallback((result: CompleteTaskResult) => {
    pendingCelebration.current = {
      level: result.new_level,
      badge: result.new_badges[0] ?? null,
    };
    setToast(result);
  }, []);

  if (isLoading || (isDoneFilter && isLoadingDone)) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-100">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bark-100">
      <TaskFilterBar active={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <ClipboardText size={48} color="#9ca3af" weight="duotone" />
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
          contentContainerClassName="gap-2 px-4 pb-24 pt-4"
          renderItem={({ item }) => {
            const isAssignedToMe =
              !item.assignee_id || item.assignee_id === family?.id;
            return (
            <TaskCard
              task={item}
              onPress={() => router.push(`/(app)/tasks/${item.id}`)}
              onComplete={() => {
                if (!family || isDoneFilter) return;
                completeTask.mutate(
                  { task: item, memberId: family.id },
                  { onSuccess: handleCompleteSuccess },
                );
              }}
              isCompleting={
                !isDoneFilter &&
                completeTask.isPending &&
                completeTask.variables?.task.id === item.id
              }
              canComplete={!isDoneFilter && isAssignedToMe}
            />
          );
          }}
        />
      )}

      <XpToast
        points={toast?.points ?? 0}
        coins={toast?.coins ?? 0}
        visible={toast !== null}
        onDismiss={dismissToast}
      />

      <LevelUpModal
        level={levelUp ?? 0}
        visible={levelUp !== null}
        onDismiss={() => {
          setLevelUp(null);
          const { badge } = pendingCelebration.current;
          if (badge) {
            setBadgeToast(badge);
            pendingCelebration.current.badge = null;
          }
        }}
      />

      <BadgeToast
        badgeName={badgeToast ?? ""}
        visible={badgeToast !== null}
        onDismiss={() => setBadgeToast(null)}
      />

      {/* FAB — any family member can create tasks */}
      {family != null && (
        <Pressable
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-jungle-500 shadow-lg"
          onPress={() => router.push("/(app)/tasks/new")}
        >
          <PlusIcon size={28} color="#fff" weight="bold" />
        </Pressable>
      )}
    </View>
  );
}
