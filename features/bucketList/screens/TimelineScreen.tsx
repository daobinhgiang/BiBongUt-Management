import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MapPin, Clock } from "phosphor-react-native";

import { useTimeline } from "../api/queries";
import { PhotoGrid } from "../components/PhotoGrid";
import { CATEGORY_CONFIG } from "../types";

export function TimelineScreen() {
  const { data: timeline, isLoading } = useTimeline();
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50 px-8">
        <Clock size={48} color="#9ca3af" weight="duotone" />
        <Text className="mt-3 text-center text-base font-medium text-gray-500">
          No memories yet.{"\n"}Complete a bucket list item to create your first!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-bark-50"
      data={timeline}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-4 px-4 py-4 pb-24"
      renderItem={({ item }) => {
        const cat = CATEGORY_CONFIG[item.bucket_list_items.category];
        const date = new Date(item.completed_at);

        return (
          <Pressable
            className="overflow-hidden rounded-2xl bg-white shadow-sm"
            onPress={() =>
              router.push(`/(app)/bucket-list/${item.item_id}`)
            }
          >
            {/* Photos */}
            {item.photos.length > 0 && (
              <PhotoGrid photos={item.photos} />
            )}

            {/* Content */}
            <View className="gap-2 p-4">
              <View className="flex-row items-center gap-2">
                <View className={`rounded-full px-2 py-0.5 ${cat.color.bg}`}>
                  <Text className={`text-xs font-medium ${cat.color.text}`}>
                    {cat.label}
                  </Text>
                </View>
                <Text className="text-xs text-gray-400">
                  {date.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>

              <Text className="text-lg font-semibold text-gray-900">
                {item.bucket_list_items.title}
              </Text>

              {item.notes && (
                <Text className="text-sm text-gray-600" numberOfLines={3}>
                  {item.notes}
                </Text>
              )}

              {item.location && (
                <View className="flex-row items-center gap-1">
                  <MapPin size={14} color="#6b7280" />
                  <Text className="text-sm text-gray-500">{item.location}</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      }}
    />
  );
}
