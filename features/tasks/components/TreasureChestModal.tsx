import { useEffect, useRef } from "react";
import { Modal, Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import ConfettiCannon from "react-native-confetti-cannon";
import { CoinVertical } from "phosphor-react-native";
import { TreasureChestIcon } from "@/components/ui/TreasureChestIcon";

type Point = { x: number; y: number };

type Props = {
  visible: boolean;
  coinsAwarded: number;
  onCollect: (coinPosition: Point) => void;
};

export function TreasureChestModal({ visible, coinsAwarded, onCollect }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const chestSize = Math.min(screenWidth * 0.22, 100);
  const glowSize = chestSize * 1.8;

  const confettiRef = useRef<ConfettiCannon>(null);
  const coinDisplayRef = useRef<View>(null);

  // Chest lid opening (rotation)
  const lidRotate = useSharedValue(0);
  // Chest scale (bounce in)
  const chestScale = useSharedValue(0);
  // Coins reveal
  const coinsScale = useSharedValue(0);
  const coinsOpacity = useSharedValue(0);
  // Shimmer glow behind chest
  const glowScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  // Button
  const buttonOpacity = useSharedValue(0);
  // Title
  const titleOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    // Reset
    lidRotate.value = 0;
    chestScale.value = 0;
    coinsScale.value = 0;
    coinsOpacity.value = 0;
    glowScale.value = 0;
    glowOpacity.value = 0;
    buttonOpacity.value = 0;
    titleOpacity.value = 0;

    // 1. Chest bounces in
    chestScale.value = withSpring(1, { damping: 8, stiffness: 120 });

    // 2. Lid opens (rotates backward)
    lidRotate.value = withDelay(
      500,
      withSequence(
        withTiming(-30, { duration: 400, easing: Easing.out(Easing.back(2)) }),
        withTiming(-25, { duration: 200 }),
      ),
    );

    // 3. Glow burst
    glowScale.value = withDelay(800, withSpring(1.2, { damping: 6, stiffness: 80 }));
    glowOpacity.value = withDelay(
      800,
      withSequence(
        withTiming(0.9, { duration: 200 }),
        withRepeat(
          withSequence(
            withTiming(0.5, { duration: 800 }),
            withTiming(0.9, { duration: 800 }),
          ),
          -1,
          true,
        ),
      ),
    );

    // 4. Coins reveal
    coinsScale.value = withDelay(900, withSpring(1, { damping: 6, stiffness: 100 }));
    coinsOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));

    // 5. Title
    titleOpacity.value = withDelay(1100, withTiming(1, { duration: 300 }));

    // 6. Button
    buttonOpacity.value = withDelay(1600, withTiming(1, { duration: 300 }));

    // Confetti after chest opens
    setTimeout(() => confettiRef.current?.start(), 900);
  }, [
    visible,
    lidRotate,
    chestScale,
    coinsScale,
    coinsOpacity,
    glowScale,
    glowOpacity,
    buttonOpacity,
    titleOpacity,
  ]);

  const chestStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chestScale.value }],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ rotateX: `${lidRotate.value}deg` }],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const coinsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinsScale.value }],
    opacity: coinsOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleCollect = () => {
    if (Platform.OS === "web") {
      // measureInWindow is unreliable on web — use screen center as fallback
      const x = typeof window !== "undefined" ? window.innerWidth / 2 : 250;
      const y = typeof window !== "undefined" ? window.innerHeight / 2 : 400;
      onCollect({ x, y });
      return;
    }
    coinDisplayRef.current?.measureInWindow((x, y, width, height) => {
      onCollect({ x: x + width / 2, y: y + height / 2 });
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCollect}
    >
      <View className="flex-1 items-center justify-center bg-black/70">
        <ConfettiCannon
          ref={confettiRef}
          count={60}
          origin={{ x: -10, y: 0 }}
          autoStart={false}
          fadeOut
          fallSpeed={2500}
          colors={["#FFD700", "#FFA500", "#DAA520", "#F0E68C", "#FFEC8B"]}
        />

        <View className="items-center gap-4 px-8">
          {/* Chest container — matches TaskCard border radius & height */}
          <View className="items-center justify-center rounded-2xl border border-bark-50 bg-white px-8 py-5 shadow-sm">
            <View className="items-center justify-center">
              <Animated.View
                style={[
                  glowAnimStyle,
                  {
                    position: "absolute",
                    width: glowSize,
                    height: glowSize,
                    borderRadius: glowSize / 2,
                    backgroundColor: "#d4a017",
                  },
                ]}
              />

              {/* Chest with lid animation */}
              <Animated.View style={chestStyle} className="items-center">
                <Animated.View style={lidStyle}>
                  <TreasureChestIcon size={chestSize} color="#8B6914" />
                </Animated.View>
              </Animated.View>
            </View>
          </View>

          {/* Coins awarded */}
          <Animated.View style={coinsStyle} className="items-center gap-2">
            <View
              ref={coinDisplayRef}
              collapsable={false}
              className="flex-row items-center gap-2 rounded-full bg-amber-100 px-6 py-3"
            >
              <CoinVertical size={32} color="#d97706" weight="fill" />
              <Text className="text-3xl font-black text-amber-700">
                +{coinsAwarded}
              </Text>
            </View>
          </Animated.View>

          {/* Title text */}
          <Animated.View style={titleStyle}>
            <Text className="text-center text-lg font-bold text-amber-200">
              Treasure Found!
            </Text>
            <Text className="mt-1 text-center text-sm text-amber-100/70">
              You earned coins for completing all daily tasks!
            </Text>
          </Animated.View>

          {/* Dismiss button */}
          <Animated.View style={buttonStyle}>
            <Pressable
              className="mt-4 rounded-full bg-amber-500 px-8 py-3"
              onPress={handleCollect}
            >
              <Text className="text-base font-semibold text-white">
                Collect!
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
