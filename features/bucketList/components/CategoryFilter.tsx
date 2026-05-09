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
    <View className="shrink-0 border-b border-bark-100">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="grow-0"
        contentContainerClassName="flex-row items-center gap-1.5 px-4 py-2"
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
