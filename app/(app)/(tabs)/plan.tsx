/**
 * Plan Tab — Calendar + Meal Planning
 *
 * Shared family calendar and meal planner. Will include:
 * - Monthly/weekly calendar view
 * - Event creation and editing
 * - Weekly meal plan grid
 * - Recipe suggestions
 * - Integration with shopping list (auto-add ingredients)
 *
 * TODO: Implement calendar and meal planning views
 */
import { View, Text } from "react-native";
import { CalendarDots, ForkKnife } from "phosphor-react-native";

export default function PlanScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-bark-50">
      <CalendarDots size={48} color="#819067" weight="duotone" />
      <Text className="mt-3 text-xl font-semibold">Plan</Text>
      <View className="mt-2 flex-row items-center gap-2">
        <CalendarDots size={16} color="#6b7280" />
        <Text className="text-gray-500">Calendar</Text>
        <Text className="text-gray-300">+</Text>
        <ForkKnife size={16} color="#6b7280" />
        <Text className="text-gray-500">Meals coming soon</Text>
      </View>
    </View>
  );
}
