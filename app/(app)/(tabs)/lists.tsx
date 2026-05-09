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
import {
  ListBullets,
  ShoppingCart,
  Package,
  Star,
  FilmSlate,
} from "phosphor-react-native";

export default function ListsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-bark-50">
      <ListBullets size={48} color="#819067" weight="duotone" />
      <Text className="mt-3 text-xl font-semibold">Lists</Text>
      <View className="mt-3 gap-2">
        <View className="flex-row items-center gap-2">
          <ShoppingCart size={16} color="#6b7280" />
          <Text className="text-gray-500">Shopping</Text>
          <Text className="text-gray-300">·</Text>
          <Package size={16} color="#6b7280" />
          <Text className="text-gray-500">Pantry</Text>
        </View>
        <View className="flex-row items-center justify-center gap-2">
          <Star size={16} color="#6b7280" />
          <Text className="text-gray-500">Bucket List</Text>
          <Text className="text-gray-300">·</Text>
          <FilmSlate size={16} color="#6b7280" />
          <Text className="text-gray-500">Movies</Text>
        </View>
        <Text className="text-center text-gray-400">coming soon</Text>
      </View>
    </View>
  );
}
