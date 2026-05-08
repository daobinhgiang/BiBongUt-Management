/**
 * Do Tab — Tasks + Challenges
 *
 * Displays the user's active tasks and available challenges.
 * Will include:
 * - Task list (filterable by assignee, status, priority)
 * - Active challenges with progress
 * - Quick-add task button
 * - XP rewards preview for each item
 *
 * TODO: Implement task list and challenge cards
 */
import { View, Text } from "react-native";

export default function DoScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-semibold">Do</Text>
      <Text className="mt-2 text-gray-500">Tasks + Challenges coming soon</Text>
    </View>
  );
}
