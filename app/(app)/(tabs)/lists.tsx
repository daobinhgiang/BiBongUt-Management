/**
 * Lists Tab — Shopping + Pantry + Bucket List + Movies
 *
 * Hub for all list-based features. Will include sub-navigation
 * (segmented control or nested tabs) for:
 * - Shopping List — collaborative grocery lists
 * - Pantry — inventory tracking with expiration dates
 * - Bucket List — family goals and dreams
 * - Movies — collaborative watchlist with voting
 *
 * TODO: Implement sub-navigation and list views
 */
import { View, Text } from "react-native";

export default function ListsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-semibold">Lists</Text>
      <Text className="mt-2 text-gray-500">Shopping, Pantry, Bucket List, Movies coming soon</Text>
    </View>
  );
}
