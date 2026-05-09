import { useEffect, useRef } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import ConfettiCannon from "react-native-confetti-cannon";
import { Lightning } from "phosphor-react-native";

type Props = {
  level: number;
  visible: boolean;
  onDismiss: () => void;
};

export function LevelUpModal({ level, visible, onDismiss }: Props) {
  const confettiRef = useRef<ConfettiCannon>(null);
  const scale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    scale.value = 0;
    textOpacity.value = 0;
    buttonOpacity.value = 0;

    // Level number: spring in
    scale.value = withSpring(1, { damping: 8, stiffness: 120 });

    // "LEVEL UP!" text fades in after the number
    textOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));

    // Dismiss button fades in last
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 300 }));

    // Fire confetti
    setTimeout(() => confettiRef.current?.start(), 200);
  }, [visible, scale, textOpacity, buttonOpacity]);

  const levelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 items-center justify-center bg-black/70">
        {/* Confetti */}
        <ConfettiCannon
          ref={confettiRef}
          count={80}
          origin={{ x: -10, y: 0 }}
          autoStart={false}
          fadeOut
          fallSpeed={2500}
        />

        {/* Content */}
        <View className="items-center gap-4 px-8">
          <Animated.View style={textStyle}>
            <Text className="text-lg font-bold uppercase tracking-widest text-jungle-300">
              Level Up!
            </Text>
          </Animated.View>

          <Animated.View
            style={levelStyle}
            className="h-32 w-32 items-center justify-center rounded-full bg-jungle-600"
          >
            <Lightning size={28} color="#fbbf24" weight="fill" />
            <Text className="text-5xl font-black text-white">{level}</Text>
          </Animated.View>

          <Animated.View style={textStyle}>
            <Text className="text-center text-base text-jungle-200">
              Keep going! New challenges await.
            </Text>
          </Animated.View>

          <Animated.View style={buttonStyle}>
            <Pressable
              className="mt-4 rounded-full bg-jungle-500 px-8 py-3"
              onPress={onDismiss}
            >
              <Text className="text-base font-semibold text-white">
                Awesome!
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
