import { useEffect } from "react";
import { Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  type SharedValue,
} from "react-native-reanimated";
import { Check } from "phosphor-react-native";
import { TreasureChestIcon } from "@/components/ui/TreasureChestIcon";

type Props = {
  completed: number;
  total: number;
  onClaimChest: () => void;
  chestClaimed: boolean;
  isClaimingChest: boolean;
  orbsAnimating?: boolean;
  barPopScale?: SharedValue<number>;
};

const isWeb = Platform.OS === "web";

export function DailyProgressBar({
  completed,
  total,
  onClaimChest,
  chestClaimed,
  isClaimingChest,
  orbsAnimating = false,
  barPopScale,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const chestContainerSize = Math.min(screenWidth * 0.14, 64);
  const chestIconSize = chestContainerSize * 0.6;

  const allDone = completed >= total;
  const fillWidth = useSharedValue(total > 0 ? completed / total : 0);
  const chestScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0);
  const fallbackScale = useSharedValue(1);
  const scale = barPopScale ?? fallbackScale;

  // Animate fill when completed changes
  useEffect(() => {
    fillWidth.value = withTiming(total > 0 ? completed / total : 0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [completed, total, fillWidth]);

  // Pulsing glow when chest is available
  useEffect(() => {
    if (allDone && !chestClaimed) {
      chestScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 900 }),
          withTiming(1, { duration: 900 }),
        ),
        -1,
        true,
      );
      buttonGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900 }),
          withTiming(0.4, { duration: 900 }),
        ),
        -1,
        true,
      );
    } else {
      chestScale.value = withTiming(1, { duration: 200 });
      buttonGlow.value = withTiming(0, { duration: 200 });
    }
  }, [allDone, chestClaimed, chestScale, buttonGlow]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fillWidth.value }],
  }));

  const chestAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chestScale.value }],
  }));

  const barPopStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonGlowStyle = useAnimatedStyle(() => {
    if (isWeb) {
      const alpha = buttonGlow.value * 0.8;
      return {
        boxShadow: `0 0 20px rgba(212, 160, 23, ${alpha})`,
      } as Record<string, string>;
    }
    return {
      shadowOpacity: buttonGlow.value,
    };
  });

  const handleChestPress = () => {
    if (isClaimingChest || chestClaimed) return;
    chestScale.value = withSequence(
      withSpring(1.25, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 120 }),
    );
    onClaimChest();
  };

  // Chest claimed state
  if (chestClaimed) {
    return (
      <View className="mb-2 rounded-3xl bg-bark-100 px-6 py-6">
        <View className="flex-row items-center justify-center gap-2">
          <Check size={18} color="#4a6741" weight="bold" />
          <Text className="text-sm font-semibold text-jungle-600">
            Daily chest claimed!
          </Text>
        </View>
      </View>
    );
  }

  // Chest available — whole section becomes a glowing tappable button
  if (allDone && !orbsAnimating) {
    return (
      <View className="mb-2 rounded-3xl bg-bark-100 px-6 py-6">
        <Pressable onPress={handleChestPress} disabled={isClaimingChest}>
          <Animated.View
            style={[
              buttonGlowStyle,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 48,
                borderRadius: 16,
                backgroundColor: "#fbbf24",
                overflow: "hidden",
                shadowColor: "#d4a017",
                shadowOffset: { width: 0, height: 0 },
                shadowRadius: 16,
              },
            ]}
          >
            <Animated.View style={chestAnimStyle}>
              <TreasureChestIcon size={28} color="#78350f" />
            </Animated.View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#78350f" }}>
              Open Daily Chest!
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    );
  }

  // Progress bar with locked chest at the end on the right
  return (
    <View className="mb-2 rounded-3xl bg-bark-100 px-6 py-6">
      <Animated.View style={barPopStyle}>
        <View className="relative h-8 flex-row items-center">
        <View className="h-8 flex-1 overflow-hidden rounded-full bg-white pr-10">
          <Animated.View
            style={[
              fillStyle,
              {
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "#819067",
                transformOrigin: "left center",
              },
            ]}
            className="rounded-full"
          />
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-xs font-bold text-bark-600">
              {completed}/{total} exp
            </Text>
          </View>
        </View>
        <View
          className="absolute -right-1 items-center justify-center rounded-full bg-bark-300"
          style={{
            width: chestContainerSize,
            height: chestContainerSize,
            top: -(chestContainerSize - 32) / 2,
          }}
        >
          <TreasureChestIcon size={chestIconSize} color="#8a7a6a" />
        </View>
        </View>
      </Animated.View>
    </View>
  );
}
