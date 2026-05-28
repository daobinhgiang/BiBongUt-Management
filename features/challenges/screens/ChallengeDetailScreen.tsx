import { useRef, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Users,
  Lightning,
  CurrencyCircleDollar,
  CalendarBlank,
  Trash,
  SignIn,
  Check,
  Sword,
} from "phosphor-react-native";

import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { useChallenge, useChallengeLogs } from "../api/queries";
import {
  useJoinChallenge,
  useCompleteChallengeTask,
  useDeleteChallenge,
} from "../api/mutations";
import { BossHPBar } from "../components/BossHPBar";
import { VictoryModal } from "../components/VictoryModal";
import { XpToast } from "@/features/tasks/components/XpToast";
import { getBossTaunt, BOSS_TEMPLATES } from "../templates";

function formatPostgrestError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const e = err as PostgrestError;
    const parts = [e.message, e.details].filter(
      (s): s is string => typeof s === "string" && s.length > 0,
    );
    return parts.join("\n") || "Request failed";
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

export function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: member } = useCurrentMember();
  const { data: challenge, isLoading } = useChallenge(id ?? "");
  const { data: logs } = useChallengeLogs(id ?? "");
  const joinChallenge = useJoinChallenge();
  const completeTask = useCompleteChallengeTask();
  const deleteChallenge = useDeleteChallenge();

  const [toast, setToast] = useState<{
    points: number;
    coins: number;
  } | null>(null);
  const [victory, setVictory] = useState<{
    xp: number;
    coins: number;
  } | null>(null);
  const didComplete = useRef(false);
  const pendingVictory = useRef<{ xp: number; coins: number } | null>(null);
  /** Blocks duplicate RPC calls before React flips `isPending` (double-tap / web repeat events). */
  const completionInFlight = useRef(false);

  const isParent = member?.role === "parent";
  const isCreator = challenge?.created_by === member?.id;
  const participants = challenge?.challenge_participants ?? [];
  const challengeTasks = challenge?.challenge_tasks ?? [];
  const isJoined = participants.some(
    (p) => p.family_member_id === member?.id,
  );
  const isActive = challenge?.status === "active";

  const totalDamage = participants.reduce(
    (sum, p) => sum + p.current_value,
    0,
  );
  const totalHP = challenge?.target_value ?? 0;

  // Get taunt text from template or use default
  const template = BOSS_TEMPLATES.find(
    (t) => t.id === challenge?.template_id,
  );
  const hpPercent =
    totalHP > 0 ? Math.max(totalHP - totalDamage, 0) / totalHP : 0;
  const tauntText = template
    ? getBossTaunt(hpPercent, template.taunts)
    : hpPercent > 0.5
      ? "You'll never defeat me!"
      : hpPercent > 0
        ? "This can't be happening..."
        : "I'm... defeated...";

  function handleCompleteTask(taskId: string) {
    if (!member || !id) return;
    if (completionInFlight.current || completeTask.isPending) return;
    completionInFlight.current = true;
    completeTask.mutate(
      { taskId, memberId: member.id, challengeId: id },
      {
        onSuccess: (result) => {
          const r = result as {
            points: number;
            coins: number;
            new_level: number | null;
          };
          if (r.points > 0 || r.coins > 0) {
            setToast({ points: r.points, coins: r.coins });
          }
        },
        onError: (err) =>
          Alert.alert("Could not complete quest", formatPostgrestError(err)),
        onSettled: () => {
          completionInFlight.current = false;
        },
      },
    );
  }

  function handleToastDismiss() {
    setToast(null);
    if (pendingVictory.current) {
      setVictory(pendingVictory.current);
      pendingVictory.current = null;
    }
  }

  function handleJoin() {
    if (!member || !id) return;
    joinChallenge.mutate(
      { challengeId: id, memberId: member.id },
      { onError: (err) => Alert.alert("Error", err.message) },
    );
  }

  function handleDelete() {
    if (!id) return;
    Alert.alert("Delete Challenge", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteChallenge.mutate(id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  // Detect challenge completion from cache update
  if (
    challenge?.status === "completed" &&
    !didComplete.current &&
    !victory
  ) {
    didComplete.current = true;
    const victoryData = {
      xp: challenge.reward_xp,
      coins: challenge.reward_coins,
    };
    // If toast is showing, queue victory for after dismiss
    if (toast) {
      pendingVictory.current = victoryData;
    } else {
      setVictory(victoryData);
    }
  }

  if (isLoading || !challenge) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bark-50">
      <ScrollView contentContainerClassName="px-4 py-4 gap-4 pb-32">
        {/* Boss Section */}
        <BossHPBar
          current={totalDamage}
          target={totalHP}
          bossName={challenge.boss_name ?? "Boss"}
          bossEmoji={challenge.boss_emoji}
          tauntText={isActive ? tauntText : undefined}
        />

        {/* Quest Board */}
        <View className="gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-2">
            <Sword size={16} color="#dc2626" />
            <Text className="text-sm font-semibold text-gray-700">
              {`Quests (${challengeTasks.filter((ct) => !ct.task.is_active).length}/${challengeTasks.length})`}
            </Text>
          </View>
          {challengeTasks.map((ct) => {
              const task = ct.task;
              const isDone = !task.is_active;
              const isMyTask =
                !task.assignee_id || task.assignee_id === member?.id;
              const canComplete =
                isActive && isJoined && !isDone && isMyTask;

              return (
                <Pressable
                  key={ct.id}
                  className={`flex-row items-center gap-3 rounded-lg border p-3 ${
                    isDone
                      ? "border-jungle-200 bg-jungle-50"
                      : "border-bark-200 bg-white"
                  }`}
                  onPress={() =>
                    canComplete && handleCompleteTask(task.id)
                  }
                  disabled={!canComplete || completeTask.isPending}
                >
                  {/* Checkbox (visual only; row handles press) */}
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                      isDone
                        ? "border-jungle-400 bg-jungle-400"
                        : canComplete
                          ? "border-bark-300"
                          : "border-bark-200 opacity-50"
                    }`}
                    pointerEvents="none"
                  >
                    {isDone && (
                      <Check size={14} color="#fff" weight="bold" />
                    )}
                  </View>

                  {/* Task info */}
                  <View className="flex-1 gap-0.5">
                    <Text
                      className={`text-sm font-medium ${
                        isDone
                          ? "text-gray-400 line-through"
                          : "text-gray-800"
                      }`}
                    >
                      {task.title}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`text-[10px] font-semibold capitalize ${
                          isDone ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {task.difficulty}
                      </Text>
                      {task.assignee_id && (
                        <Text className="text-[10px] text-gray-400">
                          Assigned
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Damage badge */}
                  <View
                    className={`rounded-full px-2 py-0.5 ${
                      isDone ? "bg-jungle-100" : "bg-red-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isDone ? "text-jungle-600" : "text-red-600"
                      }`}
                    >
                      {isDone ? "\u2713" : ct.damage} dmg
                    </Text>
                  </View>
                </Pressable>
              );
            })}
        </View>

        {/* Participants & Damage */}
        <View className="gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-2">
            <Users size={16} color="#6b7280" />
            <Text className="text-sm font-semibold text-gray-700">
              Damage Dealt
            </Text>
          </View>
          {participants.map((p) => (
            <View
              key={p.id}
              className="flex-row items-center justify-between py-1"
            >
              <Text className="text-sm text-gray-700">
                {p.member?.nickname ?? "Unknown"}
              </Text>
              <View className="flex-row items-center gap-1">
                <Sword size={12} color="#dc2626" />
                <Text className="text-xs font-semibold text-red-600">
                  {p.current_value} dmg
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Rewards info */}
        <View className="flex-row items-center justify-center gap-4 rounded-2xl bg-white p-3 shadow-sm">
          <View className="flex-row items-center gap-1">
            <Lightning size={16} color="#819067" weight="fill" />
            <Text className="text-sm font-semibold text-jungle-600">
              {challenge.reward_xp} XP
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <CurrencyCircleDollar size={16} color="#807200" />
            <Text className="text-sm font-medium text-bark-500">
              {challenge.reward_coins} coins
            </Text>
          </View>
          {challenge.end_date && (
            <View className="flex-row items-center gap-1">
              <CalendarBlank size={14} color="#9ca3af" />
              <Text className="text-xs text-gray-400">
                {new Date(challenge.end_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Join button */}
        {isActive && !isJoined && (
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-lg bg-jungle-500 py-3"
            onPress={handleJoin}
            disabled={joinChallenge.isPending}
          >
            <SignIn size={20} color="#fff" />
            <Text className="text-base font-semibold text-white">
              {joinChallenge.isPending ? "Joining..." : "Join Battle"}
            </Text>
          </Pressable>
        )}

        {/* Recent activity */}
        {(logs?.length ?? 0) > 0 && (
          <View className="gap-2 rounded-2xl bg-white p-4 shadow-sm">
            <Text className="text-sm font-semibold text-gray-700">
              Battle Log
            </Text>
            {logs?.slice(0, 20).map((log) => (
              <View
                key={log.id}
                className="flex-row items-center gap-2 py-1"
              >
                <Sword size={10} color="#dc2626" />
                <Text className="text-xs font-medium text-jungle-600">
                  {log.participant?.member?.nickname ?? "Someone"}
                </Text>
                <Text
                  className="flex-1 text-xs text-gray-500"
                  numberOfLines={1}
                >
                  {log.note ?? `dealt ${log.delta} damage`}
                </Text>
                <Text className="text-[10px] text-gray-300">
                  {new Date(log.logged_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Delete — parents or creator */}
        {(isParent || isCreator) && isActive && (
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-3"
            onPress={handleDelete}
          >
            <Trash size={18} color="#dc2626" />
            <Text className="text-sm font-medium text-red-600">
              Delete Challenge
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <XpToast
        points={toast?.points ?? 0}
        coins={toast?.coins ?? 0}
        visible={toast !== null}
        onDismiss={handleToastDismiss}
      />

      <VictoryModal
        visible={victory !== null}
        rewardXp={victory?.xp ?? 0}
        rewardCoins={victory?.coins ?? 0}
        onDismiss={() => {
          setVictory(null);
          router.back();
        }}
      />
    </View>
  );
}
