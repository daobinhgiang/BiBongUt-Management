import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Target,
  Lightning,
  CurrencyCircleDollar,
  User,
  PencilLine,
  ArrowsClockwise,
  Warning,
  CalendarBlank,
  CheckCircle,
  PencilSimple,
  Trash,
  ClockCounterClockwise,
} from "phosphor-react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useTask, useTaskCompletions } from "../api/queries";
import { useCompleteTask, useDeleteTask, type CompleteTaskResult } from "../api/mutations";
import { XpToast } from "../components/XpToast";
import { LevelUpModal } from "@/features/gamification/components/LevelUpModal";
import { BadgeToast } from "@/features/gamification/components/BadgeToast";
import { localToday, type TaskCompletionWithMember } from "../types";

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
  const deleteTask = useDeleteTask();
  const isParent = family?.role === "parent";
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
    } else {
      router.back();
    }
  }, [router]);

  if (isLoading || !task) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isOverdue = task.due_date != null && task.due_date < localToday();

  const handleComplete = () => {
    if (!family) return;
    completeTask.mutate(
      { task, memberId: family.id },
      {
        onSuccess: (result: CompleteTaskResult) => {
          pendingCelebration.current = {
            level: result.new_level,
            badge: result.new_badges[0] ?? null,
          };
          setToast(result);
        },
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not complete task"),
      },
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Task",
      `Delete "${task.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteTask.mutate(task.id, {
              onSuccess: () => router.back(),
              onError: (err) =>
                Alert.alert("Error", err.message ?? "Could not delete task"),
            }),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-bark-50">
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
          } else {
            router.back();
          }
        }}
      />
      <BadgeToast
        badgeName={badgeToast ?? ""}
        visible={badgeToast !== null}
        onDismiss={() => {
          setBadgeToast(null);
          router.back();
        }}
      />
      <ScrollView
        className="flex-1"
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
        <MetaChip
          icon={<Target size={14} color="#6b7a54" />}
          label={DIFFICULTY_LABEL[task.difficulty]}
        />
        <MetaChip
          icon={<Lightning size={14} color="#819067" weight="fill" />}
          label={`${task.points} XP`}
        />
        <MetaChip
          icon={<CurrencyCircleDollar size={14} color="#807200" />}
          label={`${task.coins_reward} coins`}
        />
        <MetaChip
          icon={<PencilLine size={14} color="#6b7a54" />}
          label={`by ${task.creator.nickname}`}
        />
        {task.assignee && (
          <MetaChip
            icon={<User size={14} color="#6b7a54" />}
            label={task.assignee.nickname}
          />
        )}
        {task.recurrence !== "none" && (
          <MetaChip
            icon={<ArrowsClockwise size={14} color="#6b7a54" />}
            label={task.recurrence}
          />
        )}
        {task.due_date && (
          <MetaChip
            icon={
              isOverdue ? (
                <Warning size={14} color="#b91c1c" weight="fill" />
              ) : (
                <CalendarBlank size={14} color="#6b7a54" />
              )
            }
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
      {task.is_active && (!task.assignee_id || task.assignee_id === family?.id) && (
        <Pressable
          className={`flex-row items-center justify-center gap-2 rounded-lg py-3 ${
            completeTask.isPending ? "bg-green-400" : "bg-green-600"
          }`}
          onPress={handleComplete}
          disabled={completeTask.isPending}
        >
          <CheckCircle size={20} color="#fff" weight="bold" />
          <Text className="text-center text-base font-semibold text-white">
            {completeTask.isPending ? "Completing..." : "Mark Complete"}
          </Text>
        </Pressable>
      )}

      {/* Edit / Delete (parent only) */}
      {isParent && task.is_active && (
        <View className="flex-row gap-3">
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-jungle-500 py-3"
            onPress={() => router.push(`/(app)/tasks/${task.id}/edit`)}
          >
            <PencilSimple size={18} color="#819067" />
            <Text className="text-base font-semibold text-jungle-600">Edit</Text>
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-red-500 py-3"
            onPress={handleDelete}
          >
            <Trash size={18} color="#ef4444" />
            <Text className="text-base font-semibold text-red-500">
              Delete
            </Text>
          </Pressable>
        </View>
      )}

      {/* Completion history */}
      {completions && completions.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-center gap-1.5">
            <ClockCounterClockwise size={20} color="#111827" />
            <Text className="text-lg font-semibold text-gray-900">
              Completion History
            </Text>
          </View>
          {completions.map((c: TaskCompletionWithMember) => (
            <View
              key={c.id}
              className="flex-row items-center justify-between rounded-lg bg-bark-50 px-3 py-2"
            >
              <Text className="text-sm text-gray-700">
                {c.completed_by_member?.nickname ?? "Unknown"}
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-row items-center gap-0.5">
                  <Lightning size={12} color="#819067" weight="fill" />
                  <Text className="text-xs text-jungle-600">
                    +{c.points_awarded}
                  </Text>
                </View>
                <Text className="text-xs text-gray-400">
                  {new Date(c.completed_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
    </View>
  );
}

function MetaChip({
  icon,
  label,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "danger";
}) {
  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full px-4 py-1.5 ${
        variant === "danger" ? "bg-red-100" : "bg-bark-100"
      }`}
    >
      {icon}
      <Text
        className={`text-sm font-medium ${
          variant === "danger" ? "text-red-700" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}
