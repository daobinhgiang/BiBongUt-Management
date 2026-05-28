import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Lightning,
  CurrencyCircleDollar,
  Fire,
  Star,
} from "phosphor-react-native";

import { useMyProfile } from "@/features/gamification";
import { xpForLevel } from "@/features/gamification";

export function StatsHeader() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useMyProfile();

  if (!profile) return null;

  const currentThreshold = xpForLevel(profile.level);
  const nextThreshold = xpForLevel(profile.level + 1);
  const xpInLevel = profile.total_xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return (
    <View
      style={{ paddingTop: insets.top + 8 }}
      className="flex-row items-center justify-between px-5 pb-3"
    >
      {/* Level */}
      <View className="flex-row items-center gap-1">
        <Lightning size={16} color="#fbbf24" weight="fill" />
        <Text className="text-sm font-bold text-jungle-700">
          Lv.{profile.level}
        </Text>
      </View>

      {/* EXP */}
      <View className="flex-row items-center gap-1">
        <Star size={16} color="#c4b5fd" weight="fill" />
        <Text className="text-sm font-bold text-jungle-700">
          {xpInLevel}/{xpNeeded} XP
        </Text>
      </View>

      {/* Streak */}
      <View className="flex-row items-center gap-1">
        <Fire size={16} color="#ef4444" weight="fill" />
        <Text className="text-sm font-bold text-jungle-700">
          {profile.current_streak}
        </Text>
      </View>

      {/* Coins */}
      <View className="flex-row items-center gap-1">
        <CurrencyCircleDollar size={16} color="#f59e0b" weight="fill" />
        <Text className="text-sm font-bold text-jungle-700">
          {profile.coins}
        </Text>
      </View>
    </View>
  );
}
