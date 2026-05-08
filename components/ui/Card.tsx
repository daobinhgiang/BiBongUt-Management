/**
 * Card Component (Stub)
 *
 * Container component with rounded corners, shadow, and padding.
 * Used for grouping related content (tasks, challenges, list items, etc.).
 *
 * TODO: Add variants (elevated, outlined, filled)
 */
import { View } from "react-native";
import type { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return (
    <View className="rounded-xl bg-white p-4 shadow-sm">{children}</View>
  );
}
