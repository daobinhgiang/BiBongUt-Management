/**
 * Avatar Component (Stub)
 *
 * Displays a user's profile image or initials fallback.
 * Supports size variants (sm, md, lg) and online status indicator.
 *
 * TODO: Implement with expo-image for optimized loading
 */
import { View, Text } from "react-native";

export function Avatar({ initials = "?" }: { initials?: string }) {
  return (
    <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-200">
      <Text className="text-sm font-semibold text-gray-600">{initials}</Text>
    </View>
  );
}
