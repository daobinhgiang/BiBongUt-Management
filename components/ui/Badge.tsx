/**
 * Badge Component (Stub)
 *
 * Small label for status indicators, counts, or categories.
 * Supports color variants and optional icon.
 *
 * TODO: Add variant props (success, warning, error, info)
 */
import { View, Text } from "react-native";

export function Badge({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-blue-100 px-2 py-0.5">
      <Text className="text-xs font-medium text-blue-700">{label}</Text>
    </View>
  );
}
