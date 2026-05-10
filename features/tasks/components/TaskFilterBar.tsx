import type { ReactNode } from "react";
import { Pressable, ScrollView, View, Text } from "react-native";
import {
  ListChecks,
  User,
  CalendarBlank,
  Warning,
  CheckCircle,
} from "phosphor-react-native";
import type { TaskFilter } from "../types";

const FILTERS: { key: TaskFilter; label: string; icon: (color: string) => ReactNode }[] = [
  { key: "all", label: "All", icon: (c) => <ListChecks size={14} color={c} /> },
  { key: "mine", label: "Mine", icon: (c) => <User size={14} color={c} /> },
  { key: "today", label: "Today", icon: (c) => <CalendarBlank size={14} color={c} /> },
  { key: "overdue", label: "Overdue", icon: (c) => <Warning size={14} color={c} /> },
  { key: "done", label: "Done", icon: (c) => <CheckCircle size={14} color={c} /> },
];

type Props = {
  active: TaskFilter;
  onChange: (filter: TaskFilter) => void;
};

export function TaskFilterBar({ active, onChange }: Props) {
  return (
    <View className="flex-row justify-end px-4 pb-2 pt-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-w-full grow-0"
        contentContainerClassName="flex-row items-center gap-0.5 rounded-lg bg-bark-100 p-0.5"
      >
        {FILTERS.map(({ key, label, icon }) => {
          const selected = active === key;
          return (
            <Pressable
              key={key}
              className={`flex-row items-center gap-1 rounded-md px-2.5 py-1 ${
                selected ? "bg-white shadow-sm" : "bg-transparent"
              }`}
              onPress={() => onChange(key)}
            >
              {icon(selected ? "#2c351f" : "#b3a56f")}
              <Text
                className={`text-xs ${
                  selected
                    ? "font-semibold text-jungle-900"
                    : "font-medium text-bark-300"
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
