import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CalendarBlank,
  Lightning,
  MapPin,
  Trash,
  Camera,
  User,
} from "phosphor-react-native";

import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { useBucketListItem, useBucketListCompletion } from "../api/queries";
import { useDeleteBucketListItem } from "../api/mutations";
import { PhotoGrid } from "../components/PhotoGrid";
import { CATEGORY_CONFIG, PRIORITY_XP } from "../types";

export function BucketListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: member } = useCurrentMember();
  const { data: item, isLoading } = useBucketListItem(id);
  const { data: completion } = useBucketListCompletion(id);
  const deleteItem = useDeleteBucketListItem();

  const isParent = member?.role === "parent";
  const isCompleted = item?.status === "completed";

  const handleDelete = () => {
    Alert.alert("Delete Item", "Are you sure you want to delete this bucket list item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteItem.mutate(id, {
            onSuccess: () => router.back(),
            onError: (err) => Alert.alert("Error", err.message),
          });
        },
      },
    ]);
  };

  if (isLoading || !item) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const cat = CATEGORY_CONFIG[item.category];

  return (
    <ScrollView className="flex-1 bg-bark-50" contentContainerClassName="gap-5 px-4 py-6 pb-32">
      {/* Header */}
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <View className={`rounded-full px-3 py-1 ${cat.color.bg}`}>
            <Text className={`text-sm font-medium ${cat.color.text}`}>{cat.label}</Text>
          </View>
          {isCompleted && (
            <View className="rounded-full bg-jungle-100 px-3 py-1">
              <Text className="text-sm font-medium text-jungle-700">Completed</Text>
            </View>
          )}
        </View>

        <Text className="text-2xl font-bold text-gray-900">{item.title}</Text>

        {item.description && (
          <Text className="text-base text-gray-600">{item.description}</Text>
        )}
      </View>

      {/* Meta */}
      <View className="flex-row flex-wrap gap-3">
        <View className="flex-row items-center gap-1">
          <Lightning size={16} color="#819067" weight="fill" />
          <Text className="text-sm font-medium text-jungle-600">
            {PRIORITY_XP[item.priority]} XP ({item.priority})
          </Text>
        </View>

        {item.target_date && (
          <View className="flex-row items-center gap-1">
            <CalendarBlank size={16} color="#6b7280" />
            <Text className="text-sm text-gray-500">
              {new Date(item.target_date + "T00:00:00").toLocaleDateString()}
            </Text>
          </View>
        )}

        <View className="flex-row items-center gap-1">
          <User size={16} color="#6b7280" />
          <Text className="text-sm text-gray-500">
            Added by {item.creator.nickname}
          </Text>
        </View>
      </View>

      {/* Completion Record */}
      {completion && (
        <View className="gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-900">Memory</Text>

          {completion.location && (
            <View className="flex-row items-center gap-1">
              <MapPin size={16} color="#6b7280" />
              <Text className="text-sm text-gray-600">{completion.location}</Text>
            </View>
          )}

          {completion.notes && (
            <Text className="text-sm text-gray-600">{completion.notes}</Text>
          )}

          {completion.photos.length > 0 && (
            <PhotoGrid photos={completion.photos} />
          )}

          <Text className="text-xs text-gray-400">
            Completed {new Date(completion.completed_at).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Actions */}
      {!isCompleted && (
        <Pressable
          className="flex-row items-center justify-center gap-2 rounded-xl bg-jungle-500 py-4"
          onPress={() => router.push(`/(app)/bucket-list/${id}/complete`)}
        >
          <Camera size={20} color="#fff" />
          <Text className="text-base font-semibold text-white">
            Mark as Complete
          </Text>
        </Pressable>
      )}

      {isParent && (
        <Pressable
          className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 py-3"
          onPress={handleDelete}
        >
          <Trash size={18} color="#ef4444" />
          <Text className="text-sm font-medium text-red-500">Delete</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
