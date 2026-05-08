/**
 * ProgressBar Component (Stub)
 *
 * Horizontal progress indicator used for XP, quest progress, challenges, etc.
 * Supports color theming and animated transitions.
 *
 * TODO: Add Reanimated animation for smooth progress changes
 */
import { View } from "react-native";

export function ProgressBar({ progress = 0 }: { progress?: number }) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <View
        className="h-full rounded-full bg-blue-600"
        style={{ width: `${clampedProgress}%` }}
      />
    </View>
  );
}
