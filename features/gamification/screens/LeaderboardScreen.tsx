import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  Trophy,
  Lightning,
  Crown,
} from "phosphor-react-native";
import { useRouter } from "expo-router";

import { useWeeklyLeaderboard, useAllTimeLeaderboard } from "../leaderboard";
import { useFamily } from "@/features/auth/hooks/useFamily";
import type { LeaderboardEntry } from "../types";

type Tab = "weekly" | "allTime";

export function LeaderboardScreen() {
  const [tab, setTab] = useState<Tab>("weekly");
  const weekly = useWeeklyLeaderboard();
  const allTime = useAllTimeLeaderboard();
  const { data: family } = useFamily();
  const router = useRouter();

  const data = tab === "weekly" ? weekly.data : allTime.data;
  const isLoading = tab === "weekly" ? weekly.isLoading : allTime.isLoading;

  return (
    <View className="flex-1 bg-bark-50">
      {/* Tab switcher */}
      <View className="border-b border-gray-100 bg-white px-3 pb-2 pt-2">
        <View className="flex-row items-center rounded-lg bg-gray-100 p-0.5">
          <TabButton
            label="This Week"
            active={tab === "weekly"}
            onPress={() => setTab("weekly")}
          />
          <TabButton
            label="All Time"
            active={tab === "allTime"}
            onPress={() => setTab("allTime")}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (data?.length ?? 0) === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Trophy size={48} color="#9ca3af" weight="duotone" />
          <Text className="mt-3 text-center text-base font-medium text-gray-500">
            No activity yet this week.
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.member_id}
          contentContainerClassName="px-4 py-4 gap-2"
          renderItem={({ item, index }) => (
            <LeaderboardRow
              entry={item}
              rank={index + 1}
              isMe={item.member_id === family?.id}
              isWeekly={tab === "weekly"}
              onPress={() =>
                router.push(`/(app)/profile/${item.member_id}`)
              }
            />
          )}
        />
      )}
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`flex-1 items-center rounded-md py-1.5 ${
        active ? "bg-white shadow-sm" : "bg-transparent"
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-sm ${
          active
            ? "font-semibold text-gray-900"
            : "font-medium text-gray-500"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function LeaderboardRow({
  entry,
  rank,
  isMe,
  isWeekly,
  onPress,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isMe: boolean;
  isWeekly: boolean;
  onPress: () => void;
}) {
  const xpValue = isWeekly ? (entry.weekly_xp ?? 0) : entry.total_xp;

  return (
    <Pressable
      className={`flex-row items-center gap-3 rounded-xl p-4 shadow-sm ${
        isMe ? "bg-jungle-50 border border-jungle-200" : "bg-white"
      }`}
      onPress={onPress}
    >
      {/* Rank */}
      <View className="w-8 items-center">
        {rank <= 3 ? (
          <Crown
            size={24}
            weight="fill"
            color={
              rank === 1
                ? "#eab308"
                : rank === 2
                  ? "#9ca3af"
                  : "#cd7f32"
            }
          />
        ) : (
          <Text className="text-base font-bold text-gray-400">{rank}</Text>
        )}
      </View>

      {/* Avatar */}
      <View className="h-10 w-10 items-center justify-center rounded-full bg-jungle-100">
        <Text className="text-sm font-bold text-jungle-700">
          {entry.nickname.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Name + level */}
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">
          {entry.nickname}
          {isMe && (
            <Text className="text-sm font-normal text-jungle-600"> (you)</Text>
          )}
        </Text>
        <Text className="text-xs text-gray-500">Level {entry.level}</Text>
      </View>

      {/* XP */}
      <View className="flex-row items-center gap-1">
        <Lightning size={14} color="#819067" weight="fill" />
        <Text className="text-sm font-bold text-jungle-700">
          {xpValue.toLocaleString()}
        </Text>
        <Text className="text-xs text-gray-400">XP</Text>
      </View>
    </Pressable>
  );
}
