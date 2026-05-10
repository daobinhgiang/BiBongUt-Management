import type { ReactNode } from "react";
import { Pressable, View, Text } from "react-native";
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
    <View className="px-4 pb-2 pt-3">
      <View className="flex-row items-center rounded-lg bg-bark-100 p-0.5">
        {FILTERS.map(({ key, label, icon }) => {
          const selected = active === key;
          return (
            <Pressable
              key={key}
              className={`flex-1 flex-row items-center justify-center gap-1 rounded-md py-1 ${
                selected ? "bg-white shadow-sm" : "bg-transparent"
              }`}
              onPress={() => onChange(key)}
            >
              {icon(selected ? "#2c351f" : "#b3a56f")}
              <Text
                className={`text-xs font-medium ${
                  selected ? "text-jungle-900" : "text-bark-300"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
