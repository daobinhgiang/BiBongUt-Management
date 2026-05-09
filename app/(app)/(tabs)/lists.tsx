/**
 * Lists Tab — Shopping + Pantry + Bucket List + Movies
 *
 * Hub for all list-based features with navigation cards.
 */
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  ShoppingCart,
  Package,
  Star,
  FilmSlate,
} from "phosphor-react-native";

type ListCard = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  route: string | null;
};

const LISTS: ListCard[] = [
  {
    title: "Bucket List",
    subtitle: "Family goals, dreams & memories",
    icon: <Star size={28} color="#819067" weight="duotone" />,
    route: "/(app)/bucket-list",
  },
  {
    title: "Shopping",
    subtitle: "Collaborative grocery lists",
    icon: <ShoppingCart size={28} color="#6b7280" weight="duotone" />,
    route: null,
  },
  {
    title: "Pantry",
    subtitle: "Inventory & expiration tracking",
    icon: <Package size={28} color="#6b7280" weight="duotone" />,
    route: null,
  },
  {
    title: "Movies",
    subtitle: "Watchlist with voting",
    icon: <FilmSlate size={28} color="#6b7280" weight="duotone" />,
    route: null,
  },
];

export default function ListsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-bark-50 px-4 pt-6">
      <Text className="mb-4 text-2xl font-bold text-gray-900">Lists</Text>

      <View className="gap-3">
        {LISTS.map((item) => (
          <Pressable
            key={item.title}
            className={`flex-row items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ${
              !item.route ? "opacity-50" : ""
            }`}
            onPress={() => {
              if (item.route) router.push(item.route as never);
            }}
            disabled={!item.route}
          >
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-bark-50">
              {item.icon}
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {item.title}
              </Text>
              <Text className="text-sm text-gray-500">{item.subtitle}</Text>
            </View>
            {!item.route && (
              <Text className="text-xs text-gray-400">Soon</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
