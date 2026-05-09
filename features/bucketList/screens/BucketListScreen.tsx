import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SectionList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Star, PlusIcon } from "phosphor-react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useBucketListItems } from "../api/queries";
import { BucketListCard } from "../components/BucketListCard";
import { StatusFilterBar } from "../components/CategoryFilter";
import {
  CATEGORY_CONFIG,
  type BucketListItemWithCreator,
  type BucketListCategory,
  type StatusFilter,
} from "../types";

type Section = {
  title: string;
  category: BucketListCategory;
  data: BucketListItemWithCreator[];
};

function groupByCategory(
  items: BucketListItemWithCreator[],
  filter: StatusFilter,
): Section[] {
  const filtered =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  const groups = new Map<BucketListCategory, BucketListItemWithCreator[]>();
  for (const item of filtered) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }

  const order: BucketListCategory[] = ["travel", "experience", "skill", "other"];
  return order
    .filter((cat) => groups.has(cat))
    .map((cat) => ({
      title: CATEGORY_CONFIG[cat].label,
      category: cat,
      data: groups.get(cat)!,
    }));
}

export function BucketListScreen() {
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: items, isLoading } = useBucketListItems();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const sections = useMemo(
    () => groupByCategory(items ?? [], filter),
    [items, filter],
  );

  const totalItems = items?.length ?? 0;
  const completedCount = items?.filter((i) => i.status === "completed").length ?? 0;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bark-50">
      {totalItems > 0 && (
        <View className="items-center gap-1.5 px-4 pb-1 pt-3">
          <Text className="text-center text-sm font-medium text-gray-600">
            {completedCount === totalItems
              ? `All ${totalItems} items complete`
              : `${completedCount} of ${totalItems} complete`}
          </Text>
          <Pressable onPress={() => router.push("/(app)/timeline")}>
            <Text className="text-center text-sm font-semibold text-jungle-600">
              View timeline
            </Text>
          </Pressable>
        </View>
      )}

      <StatusFilterBar active={filter} onChange={setFilter} />

      {sections.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Star size={48} color="#9ca3af" weight="duotone" />
          <Text className="mt-3 text-center text-base leading-6 text-gray-500">
            {totalItems === 0
              ? "Nothing on your list yet.\nTap + to add something you're looking forward to."
              : "Nothing matches this filter.\nTry a different status above."}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-2 px-4 pb-24 pt-2"
          renderSectionHeader={({ section }) => (
            <View className="mt-4 mb-1 flex-row items-center gap-2">
              <View
                className={`h-2 w-2 rounded-full ${CATEGORY_CONFIG[section.category].color.bg}`}
              />
              <Text className="text-sm font-semibold text-gray-700">
                {section.title}
              </Text>
              <Text className="text-xs text-gray-400">
                ({section.data.length})
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <BucketListCard
              item={item}
              onPress={() => router.push(`/(app)/bucket-list/${item.id}`)}
            />
          )}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB */}
      {family != null && (
        <Pressable
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-jungle-500 shadow-lg"
          onPress={() => router.push("/(app)/bucket-list/new")}
        >
          <PlusIcon size={28} color="#fff" weight="bold" />
        </Pressable>
      )}
    </View>
  );
}
