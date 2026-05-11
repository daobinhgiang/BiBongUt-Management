import { View, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  useDerivedValue,
  interpolateColor,
  FadeIn,
} from "react-native-reanimated";
import { useEffect } from "react";

const SPRING_CONFIG = { damping: 20, stiffness: 180, mass: 0.8 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabButton({
  label,
  isFocused,
  onPress,
  onLongPress,
  icon,
  activeTint,
  inactiveTint,
}: {
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  icon: (props: { color: string; size: number }) => React.ReactNode;
  activeTint: string;
  inactiveTint: string;
}) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, SPRING_CONFIG);
  }, [isFocused, progress]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: withSpring(isFocused ? -3 : 0, SPRING_CONFIG) },
    ],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isFocused ? 1 : 0.45, { duration: 250 }),
    transform: [
      { scale: withSpring(isFocused ? 1 : 0.9, SPRING_CONFIG) },
    ],
  }));

  const animatedColor = useDerivedValue(() =>
    interpolateColor(progress.value, [0, 1], [inactiveTint, activeTint])
  );

  const iconColorStyle = useAnimatedStyle(() => ({
    color: animatedColor.value,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        scale.value = withSpring(0.88, SPRING_CONFIG);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
      }}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 10,
        paddingBottom: 6,
      }}
    >
      <Animated.View style={animatedIconStyle}>
        {icon({
          color: isFocused ? activeTint : inactiveTint,
          size: 28,
        })}
      </Animated.View>

      <Animated.Text
        style={[
          animatedLabelStyle,
          { fontSize: 11, fontWeight: "600", marginTop: 4 },
        ]}
        numberOfLines={1}
      >
        <Animated.Text style={iconColorStyle}>{label}</Animated.Text>
      </Animated.Text>
    </AnimatedPressable>
  );
}

export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeTint = "#819067";
  const inactiveTint = "#9ca3af";

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={{
        flexDirection: "row",
        width: "100%",
        backgroundColor: "#ffffff",
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
        paddingBottom: Platform.OS === "web" ? 8 : Math.max(insets.bottom, 8),
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === "string"
            ? options.tabBarLabel
            : typeof options.title === "string"
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        const icon = options.tabBarIcon as
          | ((props: { color: string; size: number }) => React.ReactNode)
          | undefined;

        if (!icon) return null;

        return (
          <TabButton
            key={route.key}
            label={label}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            icon={icon}
            activeTint={activeTint}
            inactiveTint={inactiveTint}
          />
        );
      })}
    </Animated.View>
  );
}
