import { useEffect, useRef } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import ConfettiCannon from "react-native-confetti-cannon";
import { Trophy, Lightning, CurrencyCircleDollar } from "phosphor-react-native";

type Props = {
  visible: boolean;
  rewardXp: number;
  rewardCoins: number;
  onDismiss: () => void;
};

export function VictoryModal({
  visible,
  rewardXp,
  rewardCoins,
  onDismiss,
}: Props) {
  const confettiRef = useRef<ConfettiCannon>(null);
  const scale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    scale.value = 0;
    textOpacity.value = 0;
    buttonOpacity.value = 0;

    scale.value = withSpring(1, { damping: 8, stiffness: 120 });
    textOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 300 }));

    setTimeout(() => confettiRef.current?.start(), 200);
  }, [visible, scale, textOpacity, buttonOpacity]);

  const trophyStyle = useAnimatedStyle(() => ({
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
        <ConfettiCannon
          ref={confettiRef}
          count={100}
          origin={{ x: -10, y: 0 }}
          autoStart={false}
          fadeOut
          fallSpeed={2500}
        />

        <View className="items-center gap-4 px-8">
          <Animated.View style={textStyle}>
            <Text className="text-lg font-bold uppercase tracking-widest text-amber-300">
              Victory!
            </Text>
          </Animated.View>

          <Animated.View
            style={trophyStyle}
            className="h-32 w-32 items-center justify-center rounded-full bg-amber-500"
          >
            <Trophy size={56} color="#fff" weight="fill" />
          </Animated.View>

          <Animated.View style={textStyle} className="items-center gap-2">
            <Text className="text-center text-base text-amber-100">
              Challenge Complete!
            </Text>
            <View className="flex-row items-center gap-4">
              {rewardXp > 0 && (
                <View className="flex-row items-center gap-1">
                  <Lightning size={18} color="#fbbf24" weight="fill" />
                  <Text className="text-lg font-bold text-amber-300">
                    +{rewardXp} XP
                  </Text>
                </View>
              )}
              {rewardCoins > 0 && (
                <View className="flex-row items-center gap-1">
                  <CurrencyCircleDollar size={18} color="#fbbf24" />
                  <Text className="text-lg font-bold text-amber-300">
                    +{rewardCoins}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          <Animated.View style={buttonStyle}>
            <Pressable
              className="mt-4 rounded-full bg-amber-500 px-8 py-3"
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
