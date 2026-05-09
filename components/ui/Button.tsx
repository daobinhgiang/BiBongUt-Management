/**
 * Button Component (Stub)
 *
 * Reusable button component with variants (primary, secondary, outline, ghost).
 * Will support loading state, disabled state, and icon placement.
 *
 * TODO: Implement with Pressable + NativeWind styling
 */
import { Pressable, Text } from "react-native";

export function Button({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className="rounded-lg bg-jungle-500 px-4 py-3"
      onPress={onPress}
    >
      <Text className="text-center font-semibold text-white">{title}</Text>
    </Pressable>
  );
}
