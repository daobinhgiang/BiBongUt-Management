import { View, Text, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import {
  Lightning,
  CurrencyCircleDollar,
  Fire,
} from "phosphor-react-native";

import { useMyProfile } from "@/features/gamification";
import { levelProgress, xpForLevel } from "@/features/gamification";

export function StatsHeader() {
  const { width: windowWidth } = useWindowDimensions();
  const { data: profile } = useMyProfile();

  if (!profile) return null;

  /** ~22% of header row width (px-4 on each side); cap so tablets stay usable */
  const headerInnerWidth = Math.max(windowWidth - 32, 0);
  const avatarSize = Math.min(
    Math.max(Math.round(headerInnerWidth * 0.22), 46),
    108,
  );
  const progressBarHeight = Math.max(22, Math.round(avatarSize * 0.2));
  const levelRowIconSize = Math.min(Math.max(Math.round(avatarSize * 0.22), 14), 20);
  const statIconSize = Math.min(Math.max(Math.round(avatarSize * 0.2), 16), 22);
  const expLabelFontSize = Math.min(Math.max(Math.round(avatarSize * 0.12), 10), 13);
  const levelLabelFontSize = Math.min(Math.max(Math.round(avatarSize * 0.13), 11), 14);

  const progress = levelProgress(profile.total_xp) * 100;
  const currentThreshold = xpForLevel(profile.level);
  const nextThreshold = xpForLevel(profile.level + 1);
  const xpInLevel = profile.total_xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return (
    <View className="flex-row items-center justify-between px-4 pb-3 pt-3">
      {/* Left: Avatar + XP */}
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <View
          className="shrink-0 items-center justify-center overflow-hidden rounded-full bg-jungle-100"
          style={{ width: avatarSize, height: avatarSize }}
        >
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={{ width: avatarSize, height: avatarSize }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Text
              className="font-bold text-jungle-700"
              style={{ fontSize: Math.round(avatarSize * 0.38) }}
            >
              {profile.nickname.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View className="min-w-0 flex-1 justify-center">
          <View className="flex-row items-center gap-1">
            <Lightning size={levelRowIconSize} color="#fbbf24" weight="fill" />
            <Text
              className="font-semibold text-gray-900"
              style={{ fontSize: levelLabelFontSize }}
            >
              Lv.{profile.level}
            </Text>
          </View>
          <View
            className="mt-1.5 w-full items-center justify-center overflow-hidden rounded-lg bg-bark-200/60"
            style={{ height: progressBarHeight }}
          >
            <View
              className="absolute left-0 top-0 h-full rounded-lg bg-jungle-400"
              style={{ width: `${Math.max(progress, 3)}%` }}
            />
            <Text
              className="font-bold text-jungle-900"
              style={{
                fontSize: expLabelFontSize,
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
      <View className="ml-3 shrink-0 gap-1.5">
        <View className="flex-row items-center gap-1.5">
          <View style={{ width: statIconSize + 4 }} className="items-center">
            <CurrencyCircleDollar size={statIconSize} color="#fbbf24" weight="fill" />
          </View>
          <Text className="min-w-[24px] text-left text-sm font-bold text-gray-900">
            {profile.coins}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View style={{ width: statIconSize + 4 }} className="items-center">
            <Fire size={statIconSize} color="#ef4444" weight="fill" />
          </View>
          <Text className="min-w-[24px] text-left text-sm font-bold text-gray-900">
            {profile.current_streak}
          </Text>
        </View>
      </View>
    </View>
  );
}
