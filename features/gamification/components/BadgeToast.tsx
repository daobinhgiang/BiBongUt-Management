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
import { Medal } from "phosphor-react-native";

type Props = {
  badgeName: string;
  visible: boolean;
  onDismiss: () => void;
};

export function BadgeToast({ badgeName, visible, onDismiss }: Props) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(80);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (!visible) return;

    // Reset
    opacity.value = 0;
    translateX.value = 80;
    scale.value = 0.5;

    // Badge icon flies in from right
    translateX.value = withTiming(0, { duration: 400 });
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSequence(
      withTiming(1.2, { duration: 300 }),
      withTiming(1, { duration: 200 }),
    );

    // Auto-dismiss after 3s
    opacity.value = withDelay(
      3000,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished) runOnJS(onDismiss)();
      }),
    );
    translateX.value = withDelay(3000, withTiming(80, { duration: 300 }));
  }, [visible, opacity, translateX, scale, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  if (!visible) return null;

  return (
    <View
      className="absolute left-0 right-0 top-24 z-50 items-center"
      pointerEvents="none"
    >
      <Animated.View
        style={animatedStyle}
        className="flex-row items-center gap-2 rounded-full bg-jungle-800 px-5 py-3 shadow-lg"
      >
        <Medal size={24} color="#fbbf24" weight="fill" />
        <View>
          <Text className="text-xs font-medium text-jungle-300">
            Badge Unlocked!
          </Text>
          <Text className="text-sm font-bold text-white">{badgeName}</Text>
        </View>
      </Animated.View>
    </View>
  );
}
