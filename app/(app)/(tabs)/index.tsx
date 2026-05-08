/**
 * Home Tab — Dashboard
 *
 * The main landing screen after login. Will display:
 * - Active family votes
 * - Today's daily quests
 * - Family announcements
 * - Today's calendar events
 * - Quick-action shortcuts
 *
 * TODO: Implement dashboard widgets
 */
import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-semibold">Home</Text>
      <Text className="mt-2 text-gray-500">Dashboard coming soon</Text>
    </View>
  );
}
