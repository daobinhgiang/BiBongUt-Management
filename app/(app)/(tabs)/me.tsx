/**
 * Me Tab — Profile + Gamification
 *
 * Personal profile and gamification dashboard. Will include:
 * - User profile (avatar, name, role)
 * - Level + XP progress bar
 * - Badge collection
 * - Streak tracker
 * - Rewards shop link
 * - Family leaderboard
 * - Settings link
 *
 * TODO: Implement profile and gamification widgets
 */
import { View, Text } from "react-native";

export default function MeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-4xl">👤</Text>
      <Text className="mt-3 text-xl font-semibold">Me</Text>
      <Text className="mt-2 text-gray-500">🏆 Profile + 🎮 Gamification coming soon</Text>
    </View>
  );
}
