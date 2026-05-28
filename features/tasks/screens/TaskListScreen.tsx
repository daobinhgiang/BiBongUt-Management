import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowCounterClockwise, ClipboardText, PlusIcon } from "phosphor-react-native";

import { useDevMode } from "@/lib/stores/developer-mode";

import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { useTasks, useTodayCompletionCount, useDailyChestClaimed, taskKeys } from "../api/queries";
import {
  useCompleteTask,
  useEnsureDailyHabits,
  useClaimDailyChest,
  useDevResetTodayTasks,
  type CompleteTaskResult,
} from "../api/mutations";
import { TaskCard } from "../components/TaskCard";
import { HeroCard } from "../components/HeroCard";
import { SectionHeader } from "../components/SectionHeader";
import { DailyProgressBar } from "../components/DailyProgressBar";
import { FlyingXpOrb } from "../components/FlyingXpOrb";
import { FlyingCoinOrb } from "../components/FlyingCoinOrb";
import { XpToast } from "../components/XpToast";
import { TreasureChestModal } from "../components/TreasureChestModal";
import { LevelUpModal } from "@/features/gamification/components/LevelUpModal";
import { BadgeToast } from "@/features/gamification/components/BadgeToast";
import { isDueToday, localTimezone } from "@/lib/date";
import type { TaskWithAssignee } from "../types";

type Section = { title: string; data: TaskWithAssignee[] };
type Point = { x: number; y: number };

const DAILY_HABIT_TOTAL = 3;
const DAILY_HABIT_XP = 5;
const LIST_CONTENT_PADDING_TOP = 12;
const MAX_FLYING_COINS = 8;

type FlyingCoinState = {
  from: Point;
  to: Point;
  count: number;
  source: "chest" | "task";
};

type Props = {
  coinIconRef?: React.RefObject<View | null>;
  onCoinArrive?: () => void;
  onCoinsAnimationDone?: () => void;
};

export function TaskListScreen({ coinIconRef, onCoinArrive, onCoinsAnimationDone }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();
  const { data: tasks, isLoading } = useTasks();
  const { data: completedToday = 0 } = useTodayCompletionCount();
  const { data: chestClaimedFromServer = false } = useDailyChestClaimed();
  const completeTask = useCompleteTask();
  const ensureDailyHabits = useEnsureDailyHabits();
  const claimDailyChest = useClaimDailyChest();
  const devMode = useDevMode();
  const devReset = useDevResetTodayTasks();
  const [toast, setToast] = useState<{
    points: number;
    coins: number;
  } | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);
  const sectionListRef = useRef<SectionList<TaskWithAssignee>>(null);
  const listHeaderHeightRef = useRef(0);
  const pendingCelebration = useRef<{
    level: number | null;
    badge: string | null;
  }>({ level: null, badge: null });
  const seededRef = useRef(false);

  // Flying orb + progress bar state
  const [flyingOrb, setFlyingOrb] = useState<{ from: Point; to: Point; count: number } | null>(null);
  const progressBarRef = useRef<View>(null);
  const [chestClaimedLocal, setChestClaimedLocal] = useState(false);
  const chestClaimed = chestClaimedFromServer || chestClaimedLocal;
  const [chestReward, setChestReward] = useState<number | null>(null);

  // Flying coin state (shared for chest + task coins)
  const [flyingCoin, setFlyingCoin] = useState<FlyingCoinState | null>(null);

  // Track origin of the last completed non-daily task for coin animation
  const pendingTaskOrigin = useRef<Point | null>(null);

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

  const isChild = member?.role === "child";
  const viewerTz = localTimezone();

  // Seed daily habits on mount (fire-and-forget, idempotent)
  useEffect(() => {
    if (!member?.id || !member?.family_id || seededRef.current) return;
    seededRef.current = true;
    ensureDailyHabits.mutate({
      memberId: member.id,
      familyId: member.family_id,
      tz: viewerTz,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id, member?.family_id]);

  const { sections, activeDailyHabits, todayTasksRemaining } = useMemo(() => {
    let all = tasks ?? [];
    if (all.length === 0)
      return { sections: [] as Section[], activeDailyHabits: 0, todayTasksRemaining: 0 };

    if (isChild && member) {
      all = all.filter(
        (t) => !t.assignee_id || t.assignee_id === member.id,
      );
    }

    if (all.length === 0)
      return { sections: [] as Section[], activeDailyHabits: 0, todayTasksRemaining: 0 };

    const dailyHabits = all.filter(
      (t) =>
        t.task_type === "daily_habit" &&
        t.assignee_id === member?.id &&
        isDueToday(t.due_date, t.creator_tz ?? viewerTz),
    );
    const todayTasks = all.filter((t) => t.task_type !== "daily_habit");

    const result: Section[] = [];
    if (dailyHabits.length > 0) {
      result.push({ title: "Daily Tasks", data: dailyHabits });
    }
    if (todayTasks.length > 0) {
      result.push({ title: "Today's Tasks", data: todayTasks });
    }

    const dueToday = all.filter((t) =>
      isDueToday(t.due_date, t.creator_tz ?? viewerTz),
    ).length;

    return { sections: result, activeDailyHabits: dailyHabits.length, todayTasksRemaining: dueToday };
  }, [tasks, isChild, member, viewerTz]);

  const dailyCompleted = DAILY_HABIT_TOTAL - activeDailyHabits;

  const totalToday = todayTasksRemaining + completedToday;

  const handleListHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    listHeaderHeightRef.current = event.nativeEvent.layout.height;
  }, []);

  const handleGoPress = useCallback(() => {
    const targetOffset =
      LIST_CONTENT_PADDING_TOP + listHeaderHeightRef.current;
    if (sections.length > 0 && targetOffset > 0) {
      sectionListRef.current
        ?.getScrollResponder()
        ?.scrollTo({ y: targetOffset, animated: true });
    }
  }, [sections.length]);

  const handleCompleteSuccess = useCallback(
    (result: CompleteTaskResult) => {
      pendingCelebration.current = {
        level: result.new_level,
        badge: result.new_badges[0] ?? null,
      };
      setToast(result);
      if (member?.id) {
        qc.invalidateQueries({
          queryKey: taskKeys.todayCompletions(member.id),
        });
      }
    },
    [member?.id, qc],
  );

  // Launch coin animation after a non-daily task awards coins
  const launchTaskCoinAnimation = useCallback(
    (coins: number) => {
      const origin = pendingTaskOrigin.current;
      pendingTaskOrigin.current = null;

      if (coins <= 0 || !origin || !coinIconRef?.current) return;

      coinIconRef.current.measureInWindow((x, y, width, height) => {
        const to = { x: x + width / 2, y: y + height / 2 };
        setFlyingCoin({
          from: origin,
          to,
          count: Math.min(coins, MAX_FLYING_COINS),
          source: "task",
        });
      });
    },
    [coinIconRef],
  );

  const handleTaskCompleteSuccess = useCallback(
    (result: CompleteTaskResult) => {
      handleCompleteSuccess(result);
      launchTaskCoinAnimation(result.coins);
    },
    [handleCompleteSuccess, launchTaskCoinAnimation],
  );

  const handleDailyComplete = useCallback(
    (task: TaskWithAssignee, origin: Point) => {
      if (!member) return;

      const launchOrbs = (to: Point) => {
        const orbCount = Math.max(1, task.points);
        setFlyingOrb({ from: origin, to, count: orbCount });
      };

      progressBarRef.current?.measureInWindow((x, y, width, height) => {
        launchOrbs({ x: x + width / 2, y: y + height / 2 });
      });

      completeTask.mutate(
        { task, memberId: member.id },
        { onSuccess: handleCompleteSuccess },
      );
    },
    [member, completeTask, handleCompleteSuccess],
  );

  const handleOrbsArrived = useCallback(() => {
    setFlyingOrb(null);
  }, []);

  const handleClaimChest = useCallback(() => {
    if (!member?.id) return;
    claimDailyChest.mutate(
      { memberId: member.id, tz: viewerTz },
      {
        onSuccess: (result) => {
          setChestReward(result.coins_awarded);
        },
      },
    );
  }, [member?.id, claimDailyChest, viewerTz]);

  const handleCollectCoins = useCallback(
    (coinPosition: Point) => {
      const coins = chestReward ?? 0;
      setChestReward(null);

      if (!coinIconRef?.current) {
        setChestClaimedLocal(true);
        return;
      }

      coinIconRef.current.measureInWindow((x, y, width, height) => {
        const to = { x: x + width / 2, y: y + height / 2 };
        setFlyingCoin({
          from: coinPosition,
          to,
          count: Math.min(coins, MAX_FLYING_COINS),
          source: "chest",
        });
      });
    },
    [chestReward, coinIconRef],
  );

  const handleCoinsArrived = useCallback(() => {
    const source = flyingCoin?.source;
    setFlyingCoin(null);
    if (source === "chest") {
      setChestClaimedLocal(true);
    }
    onCoinsAnimationDone?.();
  }, [flyingCoin?.source, onCoinsAnimationDone]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const heroCard = (
    <View onLayout={handleListHeaderLayout}>
      <HeroCard
        tasksLeft={todayTasksRemaining}
        totalToday={totalToday}
        onGoPress={handleGoPress}
      />
      <View ref={progressBarRef} collapsable={false}>
        <DailyProgressBar
          completed={dailyCompleted * DAILY_HABIT_XP}
          total={DAILY_HABIT_TOTAL * DAILY_HABIT_XP}
          onClaimChest={handleClaimChest}
          chestClaimed={chestClaimed}
          isClaimingChest={claimDailyChest.isPending}
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-bark-50">
      {sections.length === 0 ? (
        <View className="flex-1 px-8">
          <View className="pt-3">{heroCard}</View>
          <View className="flex-1 items-center justify-center">
            <ClipboardText size={48} color="#9ca3af" weight="duotone" />
            <Text className="mt-3 text-center text-base font-medium text-gray-500">
              No tasks yet. Tap + to create one.
            </Text>
          </View>
        </View>
      ) : (
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96, paddingTop: 12 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} />
          )}
          ListHeaderComponent={heroCard}
          renderItem={({ item }) => {
            const isAssignedToMe =
              !item.assignee_id || item.assignee_id === member?.id;
            const isDailyHabit = item.task_type === "daily_habit";
            return (
              <TaskCard
                task={item}
                onPress={() => router.push(`/(app)/tasks/${item.id}`)}
                onComplete={(origin?: Point) => {
                  if (!member) return;
                  if (isDailyHabit && origin != null) {
                    handleDailyComplete(item, origin);
                  } else {
                    // Save origin so coin animation can launch after RPC returns
                    pendingTaskOrigin.current = origin ?? null;
                    completeTask.mutate(
                      { task: item, memberId: member.id },
                      { onSuccess: handleTaskCompleteSuccess },
                    );
                  }
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

      {/* Flying XP orb overlay — Modal keeps orbs above native SectionList on iOS */}
      {flyingOrb && (
        <Modal visible transparent animationType="none" statusBarTranslucent>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <FlyingXpOrb
              from={flyingOrb.from}
              to={flyingOrb.to}
              count={flyingOrb.count}
              onAllArrived={handleOrbsArrived}
            />
          </View>
        </Modal>
      )}

      {/* Flying coin orb overlay */}
      {flyingCoin && (
        <Modal visible transparent animationType="none" statusBarTranslucent>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <FlyingCoinOrb
              from={flyingCoin.from}
              to={flyingCoin.to}
              count={flyingCoin.count}
              onCoinArrive={onCoinArrive}
              onAllArrived={handleCoinsArrived}
            />
          </View>
        </Modal>
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

      <TreasureChestModal
        visible={chestReward !== null}
        coinsAwarded={chestReward ?? 0}
        onCollect={handleCollectCoins}
      />

      {member != null && devMode && (
        <Pressable
          className="absolute bottom-6 left-6 h-14 items-center justify-center rounded-full bg-amber-500 px-4 shadow-lg flex-row gap-2"
          onPress={() => {
            if (!member?.id) return;
            devReset.mutate(member.id, {
              onSuccess: async () => {
                await qc.resetQueries();
                if (typeof window !== "undefined") {
                  window.location.reload();
                } else {
                  const Updates = await import("expo-updates");
                  await Updates.reloadAsync();
                }
              },
            });
          }}
          disabled={devReset.isPending}
        >
          <ArrowCounterClockwise size={20} color="#fff" weight="bold" />
          <Text className="text-sm font-bold text-white">
            {devReset.isPending ? "Resetting..." : "Reset Tasks"}
          </Text>
        </Pressable>
      )}

      {member != null && (
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
