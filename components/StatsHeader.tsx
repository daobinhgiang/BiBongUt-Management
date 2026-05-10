import { View, Text } from "react-native";
import { Image } from "expo-image";
import {
  Lightning,
  CurrencyCircleDollar,
  Fire,
} from "phosphor-react-native";

import { useMyProfile } from "@/features/gamification";
import { levelProgress, xpForLevel } from "@/features/gamification";

export function StatsHeader() {
  const { data: profile } = useMyProfile();

  if (!profile) return null;

  const progress = levelProgress(profile.total_xp) * 100;
  const currentThreshold = xpForLevel(profile.level);
  const nextThreshold = xpForLevel(profile.level + 1);
  const xpInLevel = profile.total_xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return (
    <View className="flex-row items-center justify-between px-4 pb-3 pt-3">
      {/* Left: Avatar + XP */}
      <View className="flex-1 flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-jungle-100">
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={{ width: 48, height: 48 }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Text className="text-lg font-bold text-jungle-700">
              {profile.nickname.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Lightning size={14} color="#fbbf24" weight="fill" />
            <Text className="text-xs font-semibold text-gray-900">
              Lv.{profile.level}
            </Text>
          </View>
          <View
            className="mt-1 h-5 w-full items-center justify-center overflow-hidden rounded-lg bg-bark-200/60"
          >
            <View
              className="absolute left-0 top-0 h-full rounded-lg bg-jungle-400"
              style={{ width: `${Math.max(progress, 3)}%` }}
            />
            <Text
              className="text-[10px] font-bold text-jungle-900"
              style={{
                textShadowColor: "rgba(255,255,255,0.6)",
                textShadowOffset: { width: 0, height: 0.5 },
                textShadowRadius: 1,
              }}
            >
              {xpInLevel} / {xpNeeded} EXP
            </Text>
          </View>
        </View>
      </View>

      {/* Right: Coins + Streak */}
      <View className="ml-4 gap-1">
        <View className="flex-row items-center gap-1.5">
          <View className="w-5 items-center">
            <CurrencyCircleDollar size={16} color="#fbbf24" weight="fill" />
          </View>
          <Text className="min-w-[24px] text-left text-sm font-bold text-gray-900">
            {profile.coins}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-5 items-center">
            <Fire size={16} color="#ef4444" weight="fill" />
          </View>
          <Text className="min-w-[24px] text-left text-sm font-bold text-gray-900">
            {profile.current_streak}
          </Text>
        </View>
      </View>
    </View>
  );
}
