import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
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
  PaperPlaneTilt,
} from "phosphor-react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useChallenge, useChallengeLogs } from "../api/queries";
import {
  useJoinChallenge,
  useLogContribution,
  useDeleteChallenge,
} from "../api/mutations";
import { ProgressBar } from "../components/ProgressBar";
import { BossHPBar } from "../components/BossHPBar";
import { VictoryModal } from "../components/VictoryModal";
import { XpToast } from "@/features/tasks/components/XpToast";
import {
  CHALLENGE_TYPE_LABELS,
  type LogContributionResult,
} from "../types";

export function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: challenge, isLoading } = useChallenge(id ?? "");
  const { data: logs } = useChallengeLogs(id ?? "");
  const joinChallenge = useJoinChallenge();
  const logContribution = useLogContribution();
  const deleteChallenge = useDeleteChallenge();

  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<{ points: number; coins: number } | null>(
    null,
  );
  const [victory, setVictory] = useState<{
    xp: number;
    coins: number;
  } | null>(null);

  const isParent = family?.role === "parent";
  const participants = challenge?.challenge_participants ?? [];
  const isJoined = participants.some(
    (p) => p.family_member_id === family?.id,
  );
  const isActive = challenge?.status === "active";

  const totalValue = participants.reduce(
    (sum, p) => sum + p.current_value,
    0,
  );

  const handleLog = useCallback(() => {
    if (!family || !id) return;
    const val = Number(delta);
    if (!val || val <= 0) {
      Alert.alert("Invalid", "Enter a positive number");
      return;
    }

    logContribution.mutate(
      {
        challengeId: id,
        memberId: family.id,
        delta: val,
        note: note.trim() || undefined,
      },
      {
        onSuccess: (result: LogContributionResult) => {
          setDelta("");
          setNote("");
          if (result.error) {
            Alert.alert("Challenge", result.error);
            return;
          }
          if (result.reward_xp > 0 || result.reward_coins > 0) {
            setToast({
              points: result.reward_xp,
              coins: result.reward_coins,
            });
          }
          if (result.challenge_complete) {
            setTimeout(() => {
              setVictory({
                xp: result.reward_xp,
                coins: result.reward_coins,
              });
            }, 2500);
          }
        },
        onError: (err) => Alert.alert("Error", err.message),
      },
    );
  }, [family, id, delta, note, logContribution]);

  const handleJoin = useCallback(() => {
    if (!family || !id) return;
    joinChallenge.mutate(
      { challengeId: id, memberId: family.id },
      { onError: (err) => Alert.alert("Error", err.message) },
    );
  }, [family, id, joinChallenge]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert("Delete Challenge", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteChallenge.mutate(id, {
            onSuccess: () => router.back(),
          }),
      },
    ]);
  }, [id, deleteChallenge, router]);

  if (isLoading || !challenge) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-100">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bark-100">
      <ScrollView contentContainerClassName="px-4 py-4 gap-4 pb-32">
        {/* Header */}
        <View className="gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-900">
            {challenge.title}
          </Text>
          {challenge.description && (
            <Text className="text-sm text-gray-500">
              {challenge.description}
            </Text>
          )}
          <View className="flex-row flex-wrap items-center gap-3">
            <View className="rounded-full bg-jungle-100 px-2 py-0.5">
              <Text className="text-xs font-semibold text-jungle-700">
                {CHALLENGE_TYPE_LABELS[challenge.type]}
              </Text>
            </View>
            <View className="rounded-full bg-bark-100 px-2 py-0.5">
              <Text className="text-xs font-medium capitalize text-gray-600">
                {challenge.status}
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
          <View className="flex-row items-center gap-4">
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
          </View>
        </View>

        {/* Progress — different UI per type */}
        <View className="rounded-2xl bg-white p-4 shadow-sm">
          {challenge.type === "boss_battle" ? (
            <BossHPBar
              current={totalValue}
              target={challenge.target_value}
              unit={challenge.unit}
            />
          ) : challenge.type === "collaborative" ? (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-gray-700">
                Team Progress
              </Text>
              <ProgressBar
                current={totalValue}
                target={challenge.target_value}
                unit={challenge.unit}
              />
              {/* Individual breakdown */}
              {participants.map((p) => (
                <View
                  key={p.id}
                  className="flex-row items-center justify-between"
                >
                  <Text className="text-xs text-gray-500">
                    {p.member?.nickname ?? "Unknown"}
                  </Text>
                  <Text className="text-xs font-medium text-jungle-600">
                    {p.current_value} {challenge.unit}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            /* Solo — individual bars */
            <View className="gap-3">
              <Text className="text-sm font-semibold text-gray-700">
                Individual Progress
              </Text>
              {participants.map((p) => (
                <ProgressBar
                  key={p.id}
                  current={p.current_value}
                  target={challenge.target_value}
                  unit={challenge.unit}
                  label={p.member?.nickname ?? "Unknown"}
                  color={
                    p.completed_at ? "bg-amber-500" : "bg-jungle-500"
                  }
                />
              ))}
            </View>
          )}
        </View>

        {/* Participants */}
        <View className="gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-2">
            <Users size={16} color="#6b7280" />
            <Text className="text-sm font-semibold text-gray-700">
              Participants ({participants.length})
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
              <Text className="text-xs text-gray-400">
                {p.current_value} {challenge.unit}
                {p.completed_at && " - Done"}
              </Text>
            </View>
          ))}
        </View>

        {/* Log contribution form (inline) */}
        {isActive && isJoined && (
          <View className="gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <Text className="text-sm font-semibold text-gray-700">
              Log Progress
            </Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 rounded-lg border border-bark-200 px-3 py-2"
                placeholder={`How many ${challenge.unit}?`}
                keyboardType="number-pad"
                value={delta}
                onChangeText={setDelta}
              />
              <Pressable
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  logContribution.isPending
                    ? "bg-jungle-400"
                    : "bg-jungle-500"
                }`}
                onPress={handleLog}
                disabled={logContribution.isPending}
              >
                <PaperPlaneTilt size={18} color="#fff" weight="fill" />
              </Pressable>
            </View>
            <TextInput
              className="rounded-lg border border-bark-200 px-3 py-2"
              placeholder="Note (optional)"
              value={note}
              onChangeText={setNote}
            />
          </View>
        )}

        {/* Join button */}
        {isActive && !isJoined && (
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-lg bg-jungle-500 py-3"
            onPress={handleJoin}
            disabled={joinChallenge.isPending}
          >
            <SignIn size={20} color="#fff" />
            <Text className="text-base font-semibold text-white">
              {joinChallenge.isPending ? "Joining..." : "Join Challenge"}
            </Text>
          </Pressable>
        )}

        {/* Recent activity */}
        {(logs?.length ?? 0) > 0 && (
          <View className="gap-2 rounded-2xl bg-white p-4 shadow-sm">
            <Text className="text-sm font-semibold text-gray-700">
              Recent Activity
            </Text>
            {logs?.slice(0, 20).map((log) => (
              <View key={log.id} className="flex-row items-center gap-2 py-1">
                <Text className="text-xs font-medium text-jungle-600">
                  {log.participant?.member?.nickname ?? "Someone"}
                </Text>
                <Text className="text-xs text-gray-500">
                  +{log.delta} {challenge.unit}
                </Text>
                {log.note && (
                  <Text className="flex-1 text-xs text-gray-400" numberOfLines={1}>
                    - {log.note}
                  </Text>
                )}
                <Text className="text-[10px] text-gray-300">
                  {new Date(log.logged_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Delete — parents only */}
        {isParent && isActive && (
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
        onDismiss={() => setToast(null)}
      />

      <VictoryModal
        visible={victory !== null}
        rewardXp={victory?.xp ?? 0}
        rewardCoins={victory?.coins ?? 0}
        onDismiss={() => {
          setVictory(null);
          if (challenge.status !== "active") {
            router.back();
          }
        }}
      />
    </View>
  );
}
