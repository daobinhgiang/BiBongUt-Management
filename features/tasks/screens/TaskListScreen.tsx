import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ClipboardText, PlusIcon, Sword } from "phosphor-react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useTasks, useCompletedTasks, useChallengeTasks } from "../api/queries";
import { useCompleteTask, type CompleteTaskResult } from "../api/mutations";
import { useSyncChoreTasks } from "../hooks/useSyncChoreTasks";
import { TaskCard } from "../components/TaskCard";
import { TaskFilterBar } from "../components/TaskFilterBar";
import { XpToast } from "../components/XpToast";
import { LevelUpModal } from "@/features/gamification/components/LevelUpModal";
import { BadgeToast } from "@/features/gamification/components/BadgeToast";
import {
  isDueToday,
  isOverdue as isTaskOverdue,
  type TaskFilter,
  type TaskWithAssignee,
  type ChallengeTaskForList,
} from "../types";

function filterTasks(
  tasks: TaskWithAssignee[],
  filter: TaskFilter,
  myMemberId: string | undefined,
): TaskWithAssignee[] {
  switch (filter) {
    case "mine_today":
      return tasks.filter(
        (t) =>
          t.assignee_id === myMemberId &&
          isDueToday(t.due_date, t.creator_tz ?? "UTC"),
      );
    case "mine":
      return tasks.filter((t) => t.assignee_id === myMemberId);
    case "today":
      return tasks.filter((t) =>
        isDueToday(t.due_date, t.creator_tz ?? "UTC"),
      );
    case "overdue":
      return tasks.filter((t) =>
        isTaskOverdue(t.due_date, t.creator_tz ?? "UTC"),
      );
    default:
      return tasks;
  }
}

type SectionItem = TaskWithAssignee | ChallengeTaskForList;
type Section = { title: string; data: SectionItem[] };

export function TaskListScreen() {
  const router = useRouter();
  const { data: family } = useFamily();
  useSyncChoreTasks();
  const { data: tasks, isLoading } = useTasks();
  const { data: completedTasks, isLoading: isLoadingDone } =
    useCompletedTasks();
  const { data: challengeTasks } = useChallengeTasks();
  const completeTask = useCompleteTask();
  const [filter, setFilter] = useState<TaskFilter>("mine_today");
  const [toast, setToast] = useState<{
    points: number;
    coins: number;
  } | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);
  const pendingCelebration = useRef<{
    level: number | null;
    badge: string | null;
  }>({ level: null, badge: null });
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
  const isChallengeFilter = filter === "challenges";
  const sourceData = isDoneFilter ? completedTasks : tasks;

  const sections = useMemo<Section[]>(() => {
    if (isChallengeFilter) {
      return challengeTasks?.length
        ? [{ title: "Boss Battle Tasks", data: challengeTasks }]
        : [];
    }

    const filtered = isDoneFilter
      ? (completedTasks ?? [])
      : filterTasks(tasks ?? [], filter, family?.id);

    if (filtered.length === 0) return [];

    return [{ title: isDoneFilter ? "Completed" : "Tasks", data: filtered }];
  }, [
    tasks,
    completedTasks,
    challengeTasks,
    filter,
    family?.id,
    isDoneFilter,
    isChallengeFilter,
  ]);

  const handleCompleteSuccess = useCallback((result: CompleteTaskResult) => {
    pendingCelebration.current = {
      level: result.new_level,
      badge: result.new_badges[0] ?? null,
    };
    setToast(result);
  }, []);

  if (isLoading || (isDoneFilter && isLoadingDone)) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bark-50">
      <TaskFilterBar active={filter} onChange={setFilter} />

      {sections.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <ClipboardText size={48} color="#9ca3af" weight="duotone" />
          <Text className="mt-3 text-center text-base font-medium text-gray-500">
            {isDoneFilter
              ? "No completed tasks yet."
              : isChallengeFilter
                ? "No challenge tasks right now."
                : (sourceData?.length ?? 0) === 0
                  ? "No tasks yet. Tap + to create one."
                  : "Nothing matches that filter."}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-2 px-4 pb-24"
          renderSectionHeader={({ section }) =>
            sections.length > 1 ? (
              <View className="flex-row items-center gap-2 pb-1 pt-3">
                {section.title === "Boss Battle Tasks" && (
                  <Sword size={16} color="#6b7a54" weight="bold" />
                )}
                <Text className="text-sm font-semibold text-jungle-700">
                  {section.title}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isChallenge = "challenge_title" in item;
            const isAssignedToMe =
              !item.assignee_id || item.assignee_id === family?.id;
            return (
              <TaskCard
                task={item}
                onPress={() => router.push(`/(app)/tasks/${item.id}`)}
                onComplete={() => {
                  if (!family || isDoneFilter || isChallengeFilter) return;
                  completeTask.mutate(
                    { task: item, memberId: family.id },
                    { onSuccess: handleCompleteSuccess },
                  );
                }}
                isCompleting={
                  !isDoneFilter &&
                  !isChallengeFilter &&
                  completeTask.isPending &&
                  completeTask.variables?.task.id === item.id
                }
                canComplete={
                  !isDoneFilter && !isChallengeFilter && isAssignedToMe
                }
                subtitle={
                  isChallenge
                    ? `${(item as ChallengeTaskForList).challenge_title} — ${(item as ChallengeTaskForList).damage} dmg`
                    : undefined
                }
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

      {/* FAB -- any family member can create tasks */}
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
