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
import { useTasks } from "../api/queries";
import { useCompleteTask, type CompleteTaskResult } from "../api/mutations";
import { TaskCard } from "../components/TaskCard";
import { XpToast } from "../components/XpToast";
import { LevelUpModal } from "@/features/gamification/components/LevelUpModal";
import { BadgeToast } from "@/features/gamification/components/BadgeToast";
import type { TaskWithAssignee } from "../types";

type Section = { title: string; data: TaskWithAssignee[] };

export function TaskListScreen() {
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: tasks, isLoading } = useTasks();
  const completeTask = useCompleteTask();
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

  const isChild = family?.role === "child";

  const sections = useMemo<Section[]>(() => {
    let all = tasks ?? [];
    if (all.length === 0) return [];

    // Children only see tasks assigned to them (or unassigned)
    if (isChild && family) {
      all = all.filter(
        (t) => !t.assignee_id || t.assignee_id === family.id,
      );
    }

    if (all.length === 0) return [];
    return [{ title: "Tasks", data: all }];
  }, [tasks, isChild, family]);

  const handleCompleteSuccess = useCallback((result: CompleteTaskResult) => {
    pendingCelebration.current = {
      level: result.new_level,
      badge: result.new_badges[0] ?? null,
    };
    setToast(result);
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bark-50">
      {sections.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <ClipboardText size={48} color="#9ca3af" weight="duotone" />
          <Text className="mt-3 text-center text-base font-medium text-gray-500">
            No tasks yet. Tap + to create one.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-24 pt-3"
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderSectionHeader={() => null}
          renderItem={({ item }) => {
            const isAssignedToMe =
              !item.assignee_id || item.assignee_id === family?.id;
            return (
              <TaskCard
                task={item}
                onPress={() => router.push(`/(app)/tasks/${item.id}`)}
                onComplete={() => {
                  if (!family) return;
                  completeTask.mutate(
                    { task: item, memberId: family.id },
                    { onSuccess: handleCompleteSuccess },
                  );
                }}
                isCompleting={
                  completeTask.isPending &&
                  completeTask.variables?.task.id === item.id
                }
                canComplete={isAssignedToMe}
                showAssigneeAndDeadline={!isChild}
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
