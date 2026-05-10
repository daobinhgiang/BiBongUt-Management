import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  Lightning,
  CurrencyCircleDollar,
  Fire,
  Trophy,
  Medal,
  Lock,
  ArrowRight,
  Camera,
} from "phosphor-react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { useMemberProfile, useMyProfile } from "../api/profile";
import { useUploadAvatar } from "../api/avatar";
import { useMemberBadges } from "../badges";
import { useRecentActivity } from "../xp";
import { levelProgress, xpForLevel, xpToNextLevel } from "../levels";
import type { BadgeWithUnlock, Transaction } from "../types";

type Props = {
  memberId?: string;
};

export function ProfileScreen({ memberId }: Props) {
  const myProfile = useMyProfile();
  const targetId = memberId ?? myProfile.data?.id;
  const profile = useMemberProfile(targetId);
  const badges = useMemberBadges(targetId);
  const activity = useRecentActivity(targetId ?? "");
  const router = useRouter();
  const uploadAvatar = useUploadAvatar();
  const isOwnProfile = !memberId;

  const p = memberId ? profile.data : myProfile.data;
  const isLoading = memberId ? profile.isLoading : myProfile.isLoading;

  if (isLoading || !p) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const progress = levelProgress(p.total_xp) * 100;
  const nextLevelXp = xpToNextLevel(p.total_xp);
  const nextThreshold = xpForLevel(p.level + 1);

  const earnedBadges =
    badges.data?.filter((b) => b.unlocked_at !== null) ?? [];
  const recentBadges = earnedBadges.slice(0, 6);
  const allBadges = badges.data ?? [];

  return (
    <ScrollView
      className="flex-1 bg-bark-50"
      contentContainerClassName="pb-24"
    >
      {/* Header card */}
      <View className="bg-jungle-700 px-6 pb-8 pt-10">
        {/* Avatar + name */}
        <View className="items-center gap-2">
          <Pressable
            disabled={!isOwnProfile || uploadAvatar.isPending}
            onPress={() => {
              if (!targetId) return;
              uploadAvatar.mutate(targetId, {
                onError: (err) => {
                  if (err.message === "cancelled") return;
                  Alert.alert("Upload failed", err.message);
                },
              });
            }}
          >
            <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-jungle-600">
              {p.avatar_url ? (
                <Image
                  source={{ uri: p.avatar_url }}
                  style={{ width: 80, height: 80 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <Text className="text-3xl font-bold text-white">
                  {p.nickname.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            {isOwnProfile && (
              <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                {uploadAvatar.isPending ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Camera size={16} color="#819067" weight="fill" />
                )}
              </View>
            )}
          </Pressable>
          <Text className="text-xl font-bold text-white">{p.nickname}</Text>
          <Text className="text-sm capitalize text-jungle-200">{p.role}</Text>
        </View>

        {/* Level + XP bar */}
        <View className="mt-5 gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-jungle-100">
              Level {p.level}
            </Text>
            <Text className="text-xs text-jungle-200">
              {nextLevelXp} XP to Level {p.level + 1}
            </Text>
          </View>
          <ProgressBar progress={progress} />
          <Text className="text-center text-xs text-jungle-200">
            {p.total_xp} / {nextThreshold} XP
          </Text>
        </View>

        {/* Stats row */}
        <View className="mt-5 flex-row justify-around">
          <StatPill
            icon={<Lightning size={16} color="#fbbf24" weight="fill" />}
            value={String(p.total_xp)}
            label="XP"
          />
          <StatPill
            icon={<CurrencyCircleDollar size={16} color="#fbbf24" weight="fill" />}
            value={String(p.coins)}
            label="Coins"
          />
          <StatPill
            icon={<Fire size={16} color="#ef4444" weight="fill" />}
            value={String(p.current_streak)}
            label="Streak"
          />
          <StatPill
            icon={<Trophy size={16} color="#a78bfa" weight="fill" />}
            value={String(earnedBadges.length)}
            label="Badges"
          />
        </View>
      </View>

      {/* Streak detail */}
      <View className="mx-4 mt-4 rounded-xl bg-white p-4 shadow-sm">
        <View className="flex-row items-center gap-2">
          <Fire size={20} color="#ef4444" weight="fill" />
          <Text className="text-base font-semibold text-gray-900">Streak</Text>
        </View>
        <View className="mt-3 flex-row items-center justify-around">
          <View className="items-center rounded-lg bg-bark-50 px-6 py-2">
            <Text className="text-2xl font-extrabold text-gray-900">
              {p.current_streak}
            </Text>
            <Text className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Current
            </Text>
          </View>
          <View className="h-12 w-px bg-gray-200" />
          <View className="items-center rounded-lg bg-jungle-50 px-6 py-2">
            <Text className="text-2xl font-extrabold text-jungle-700">
              {p.longest_streak}
            </Text>
            <Text className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Longest
            </Text>
          </View>
        </View>
      </View>

      {/* Recent badges */}
      <View className="mx-4 mt-4 rounded-xl bg-white p-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Medal size={20} color="#819067" weight="fill" />
            <Text className="text-base font-semibold text-gray-900">
              Badges
            </Text>
          </View>
          <Text className="text-xs text-gray-400">
            {earnedBadges.length} / {allBadges.length}
          </Text>
        </View>

        {recentBadges.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {recentBadges.map((b) => (
              <BadgeChip key={b.id} badge={b} />
            ))}
          </View>
        ) : (
          <Text className="mt-3 text-sm text-gray-400">
            No badges earned yet. Complete tasks to unlock!
          </Text>
        )}

        {/* All badges grid */}
        <View className="mt-4 flex-row flex-wrap gap-2">
          {allBadges
            .filter((b) => b.unlocked_at === null)
            .map((b) => (
              <LockedBadgeChip key={b.id} badge={b} />
            ))}
        </View>
      </View>

      {/* Leaderboard link */}
      <Pressable
        className="mx-4 mt-4 flex-row items-center justify-between rounded-xl bg-white p-4 shadow-sm"
        onPress={() => router.push("/(app)/leaderboard")}
      >
        <View className="flex-row items-center gap-2">
          <Trophy size={20} color="#819067" weight="fill" />
          <Text className="text-base font-semibold text-gray-900">
            Leaderboard
          </Text>
        </View>
        <ArrowRight size={20} color="#9ca3af" />
      </Pressable>

      {/* Rewards Shop link */}
      <Pressable
        className="mx-4 mt-4 flex-row items-center justify-between rounded-xl bg-white p-4 shadow-sm"
        onPress={() => router.push("/(app)/rewards")}
      >
        <View className="flex-row items-center gap-2">
          <CurrencyCircleDollar size={20} color="#807200" weight="fill" />
          <Text className="text-base font-semibold text-gray-900">
            Rewards Shop
          </Text>
        </View>
        <ArrowRight size={20} color="#9ca3af" />
      </Pressable>

      {/* Recent activity */}
      <View className="mx-4 mt-4 rounded-xl bg-white p-4 shadow-sm">
        <Text className="text-base font-semibold text-gray-900">
          Recent Activity
        </Text>
        {(activity.data?.length ?? 0) > 0 ? (
          <View className="mt-3 gap-2">
            {activity.data?.slice(0, 10).map((t) => (
              <ActivityRow key={t.id} transaction={t} />
            ))}
          </View>
        ) : (
          <Text className="mt-3 text-sm text-gray-400">
            No activity yet.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View className="items-center gap-0.5">
      <View className="flex-row items-center gap-1">
        {icon}
        <Text className="text-sm font-bold text-white">{value}</Text>
      </View>
      <Text className="text-xs text-jungle-200">{label}</Text>
    </View>
  );
}

function BadgeChip({ badge }: { badge: BadgeWithUnlock }) {
  return (
    <View className="rounded-full bg-jungle-100 px-3 py-1">
      <Text className="text-xs font-medium text-jungle-700">{badge.name}</Text>
    </View>
  );
}

function LockedBadgeChip({ badge }: { badge: BadgeWithUnlock }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
      <Lock size={10} color="#9ca3af" />
      <Text className="text-xs text-gray-400">{badge.name}</Text>
    </View>
  );
}

function ActivityRow({ transaction }: { transaction: Transaction }) {
  const isPositive = transaction.delta_xp > 0 || transaction.delta_coins > 0;
  return (
    <View className="flex-row items-center justify-between">
      <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>
        {transaction.reason}
      </Text>
      <View className="flex-row items-center gap-2">
        {transaction.delta_xp !== 0 && (
          <Text
            className={`text-xs font-medium ${isPositive ? "text-jungle-600" : "text-red-500"}`}
          >
            {isPositive ? "+" : ""}
            {transaction.delta_xp} XP
          </Text>
        )}
        {transaction.delta_coins !== 0 && (
          <Text
            className={`text-xs font-medium ${isPositive ? "text-bark-600" : "text-red-500"}`}
          >
            {isPositive ? "+" : ""}
            {transaction.delta_coins}
          </Text>
        )}
      </View>
    </View>
  );
}
