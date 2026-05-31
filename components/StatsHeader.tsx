import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import {
  Lightning,
  CoinVertical,
  Fire,
  Star,
} from "phosphor-react-native";

import { useMyProfile } from "@/features/gamification";
import { xpForLevel } from "@/features/gamification";

type Props = {
  coinIconRef?: React.RefObject<View | null>;
  bonusCoins?: number;
  coinPopScale?: SharedValue<number>;
};

export function StatsHeader({ coinIconRef, bonusCoins = 0, coinPopScale }: Props) {
  const { data: profile } = useMyProfile();
  const fallbackScale = useSharedValue(1);
  const scale = coinPopScale ?? fallbackScale;

  const coinPopStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!profile) return null;

  const currentThreshold = xpForLevel(profile.level);
  const nextThreshold = xpForLevel(profile.level + 1);
  const xpInLevel = profile.total_xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return (
    <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
      {/* Level */}
      <View className="flex-row items-center gap-1">
        <Lightning size={22} color="#fbbf24" weight="fill" />
        <Text className="text-base font-bold text-jungle-700">
          Lv.{profile.level}
        </Text>
      </View>

      {/* EXP */}
      <View className="flex-row items-center gap-1">
        <Star size={22} color="#c4b5fd" weight="fill" />
        <Text className="text-base font-bold text-jungle-700">
          {xpInLevel}/{xpNeeded} XP
        </Text>
      </View>

      {/* Streak */}
      <View className="flex-row items-center gap-1">
        <Fire size={22} color="#ef4444" weight="fill" />
        <Text className="text-base font-bold text-jungle-700">
          {profile.current_streak}
        </Text>
      </View>

      {/* Coins */}
      <Animated.View
        ref={coinIconRef}
        collapsable={false}
        style={coinPopStyle}
        className="flex-row items-center gap-1"
      >
        <CoinVertical size={22} color="#d97706" weight="fill" />
        <Text className="text-base font-bold text-amber-700">
          {profile.coins + bonusCoins}
        </Text>
      </Animated.View>
    </View>
  );
}
