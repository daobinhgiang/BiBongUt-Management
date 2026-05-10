import { Pressable, ScrollView, Text, View } from "react-native";
import type { StatusFilter } from "../types";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

type Props = {
  active: StatusFilter;
  onChange: (filter: StatusFilter) => void;
};

export function StatusFilterBar({ active, onChange }: Props) {
  return (
    <View className="shrink-0 flex-row justify-end border-b border-bark-100 bg-bark-50 px-3 pb-2 pt-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-w-full grow-0"
        contentContainerClassName="flex-row items-center gap-1.5"
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            className={`rounded-full px-3 py-1 ${
              active === f.key
                ? "bg-jungle-500"
                : "bg-white border border-bark-200"
            }`}
            onPress={() => onChange(f.key)}
          >
            <Text
              className={`text-xs font-medium ${
                active === f.key ? "text-white" : "text-gray-600"
              }`}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
