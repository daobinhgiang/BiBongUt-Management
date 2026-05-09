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
import { UserCircle, Trophy, GameController } from "phosphor-react-native";

export default function MeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-bark-50">
      <UserCircle size={48} color="#819067" weight="duotone" />
      <Text className="mt-3 text-xl font-semibold">Me</Text>
      <View className="mt-2 flex-row items-center gap-2">
        <Trophy size={16} color="#6b7280" />
        <Text className="text-gray-500">Profile</Text>
        <Text className="text-gray-300">+</Text>
        <GameController size={16} color="#6b7280" />
        <Text className="text-gray-500">Gamification coming soon</Text>
      </View>
    </View>
  );
}
