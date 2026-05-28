import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";

type Props = {
  points: number;
  coins: number;
  visible: boolean;
  onDismiss: () => void;
};

export function XpToast({ points, coins, visible, onDismiss }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (!visible) return;

    // Reset to initial state before animating (handles rapid re-shows)
    opacity.value = 0;
    scale.value = 0.8;
    translateY.value = 20;

    // Enter: fade in + scale up + slide up
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSequence(
      withTiming(1.15, { duration: 200 }),
      withTiming(1, { duration: 150 }),
    );
    translateY.value = withTiming(0, { duration: 200 });

    // Exit: fade out after 2s
    opacity.value = withDelay(
      2000,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(onDismiss)();
        }
      }),
    );
    translateY.value = withDelay(
      2000,
      withTiming(-10, { duration: 300 }),
    );
  }, [visible, opacity, scale, translateY, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  if (!visible) return null;

  const showXp = points > 0;
  const showCoins = coins > 0;
  const showBoth = showXp && showCoins;

  return (
    <View className="absolute left-0 right-0 top-16 z-50 items-center" pointerEvents="none">
      <Animated.View
        style={animatedStyle}
        className="flex-row items-center gap-3 rounded-full bg-jungle-900 px-5 py-2.5 shadow-lg"
      >
        {showXp && (
          <Text className="text-base font-bold text-jungle-200">
            +{points} XP
          </Text>
        )}
        {showBoth && <View className="h-4 w-px bg-jungle-700" />}
        {showCoins && (
          <Text className="text-base font-bold text-bark-300">
            +{coins} coins
          </Text>
        )}
      </Animated.View>
    </View>
  );
}
