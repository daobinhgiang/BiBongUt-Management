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

  return (
    <View className="absolute left-0 right-0 top-16 z-50 items-center" pointerEvents="none">
      <Animated.View
        style={animatedStyle}
        className="flex-row items-center gap-3 rounded-full bg-gray-900 px-5 py-2.5 shadow-lg"
      >
        <Text className="text-base font-bold text-blue-400">
          +{points} XP
        </Text>
        <View className="h-4 w-px bg-gray-600" />
        <Text className="text-base font-bold text-yellow-400">
          +{coins} coins
        </Text>
      </Animated.View>
    </View>
  );
}
