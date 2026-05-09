import { Pressable, ScrollView, Text, View } from "react-native";
import type { TaskFilter } from "../types";

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "📋 All" },
  { key: "mine", label: "👤 Mine" },
  { key: "today", label: "📅 Today" },
  { key: "overdue", label: "⚠️ Overdue" },
  { key: "done", label: "✅ Done" },
];

type Props = {
  active: TaskFilter;
  onChange: (filter: TaskFilter) => void;
};

export function TaskFilterBar({ active, onChange }: Props) {
  return (
    <View className="border-b border-gray-100 bg-white px-3 pb-2 pt-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-center gap-0.5 rounded-lg bg-gray-100 p-0.5"
      >
        {FILTERS.map(({ key, label }) => {
          const selected = active === key;
          return (
            <Pressable
              key={key}
              className={`rounded-md px-2.5 py-1 ${
                selected ? "bg-white shadow-sm" : "bg-transparent"
              }`}
              onPress={() => onChange(key)}
            >
              <Text
                className={`text-xs ${
                  selected
                    ? "font-semibold text-gray-900"
                    : "font-medium text-gray-500"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
