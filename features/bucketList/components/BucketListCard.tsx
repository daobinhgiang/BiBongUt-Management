import { Pressable, Text, View } from "react-native";
import {
  CalendarBlank,
  Lightning,
  MapPin,
  CheckCircle,
} from "phosphor-react-native";
import { CATEGORY_CONFIG, PRIORITY_XP, type BucketListItemWithCreator } from "../types";

type Props = {
  item: BucketListItemWithCreator;
  onPress: () => void;
};

export function BucketListCard({ item, onPress }: Props) {
  const cat = CATEGORY_CONFIG[item.category];
  const isCompleted = item.status === "completed";

  return (
    <Pressable
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        isCompleted ? "border-jungle-200 opacity-80" : "border-bark-50"
      }`}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            {isCompleted && (
              <CheckCircle size={18} color="#819067" weight="fill" />
            )}
            <Text
              className={`text-base font-semibold ${
                isCompleted ? "text-gray-400 line-through" : "text-gray-900"
              }`}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>

          {item.description && !isCompleted && (
            <Text className="text-sm text-gray-500" numberOfLines={1}>
              {item.description}
            </Text>
          )}

          <View className="mt-1 flex-row items-center gap-2">
            {/* Category badge */}
            <View className={`rounded-full px-2 py-0.5 ${cat.color.bg}`}>
              <Text className={`text-xs font-medium ${cat.color.text}`}>
                {cat.label}
              </Text>
            </View>

            {/* Priority / XP */}
            <View className="flex-row items-center gap-0.5">
              <Lightning size={12} color="#819067" weight="fill" />
              <Text className="text-xs font-medium text-jungle-600">
                {PRIORITY_XP[item.priority]} XP
              </Text>
            </View>

            {/* Target date */}
            {item.target_date && (
              <View className="flex-row items-center gap-0.5">
                <CalendarBlank size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-400">
                  {new Date(item.target_date + "T00:00:00").toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Priority indicator */}
        <View
          className={`ml-2 rounded-full px-2 py-0.5 ${
            item.priority === "large"
              ? "bg-red-100"
              : item.priority === "medium"
                ? "bg-amber-100"
                : "bg-green-100"
          }`}
        >
          <Text
            className={`text-xs font-medium capitalize ${
              item.priority === "large"
                ? "text-red-700"
                : item.priority === "medium"
                  ? "text-amber-700"
                  : "text-green-700"
            }`}
          >
            {item.priority}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
