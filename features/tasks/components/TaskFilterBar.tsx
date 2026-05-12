import { useState, type ReactNode } from "react";
import { Pressable, View, Text, Modal } from "react-native";
import {
  ListChecks,
  User,
  CalendarBlank,
  Warning,
  CheckCircle,
  FunnelSimple,
  CaretDown,
  UserList,
} from "phosphor-react-native";
import type { TaskFilter } from "../types";

const FILTERS: {
  key: TaskFilter;
  label: string;
  icon: (color: string) => ReactNode;
}[] = [
  {
    key: "mine_today",
    label: "My Tasks Today",
    icon: (c) => <UserList size={16} color={c} />,
  },
  { key: "all", label: "All", icon: (c) => <ListChecks size={16} color={c} /> },
  { key: "mine", label: "Mine", icon: (c) => <User size={16} color={c} /> },
  {
    key: "today",
    label: "Today",
    icon: (c) => <CalendarBlank size={16} color={c} />,
  },
  {
    key: "overdue",
    label: "Overdue",
    icon: (c) => <Warning size={16} color={c} />,
  },
  {
    key: "done",
    label: "Done",
    icon: (c) => <CheckCircle size={16} color={c} />,
  },
];

type Props = {
  active: TaskFilter;
  onChange: (filter: TaskFilter) => void;
};

export function TaskFilterBar({ active, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = FILTERS.find((f) => f.key === active) ?? FILTERS[0];

  return (
    <View className="px-4 pb-2 pt-3">
      <Pressable
        className="flex-row items-center gap-1.5 self-start rounded-lg bg-bark-100 px-3 py-2"
        onPress={() => setOpen(true)}
      >
        <FunnelSimple size={16} color="#2c351f" />
        {current.icon("#2c351f")}
        <Text className="text-sm font-medium text-jungle-900">
          {current.label}
        </Text>
        <CaretDown size={12} color="#2c351f" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/30"
          onPress={() => setOpen(false)}
        >
          <View className="mx-4 mt-28 rounded-xl bg-white p-2 shadow-lg">
            {FILTERS.map(({ key, label, icon }) => {
              const selected = active === key;
              return (
                <Pressable
                  key={key}
                  className={`flex-row items-center gap-2.5 rounded-lg px-3 py-2.5 ${
                    selected ? "bg-bark-100" : "bg-transparent"
                  }`}
                  onPress={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                >
                  {icon(selected ? "#2c351f" : "#b3a56f")}
                  <Text
                    className={`text-sm font-medium ${
                      selected ? "text-jungle-900" : "text-bark-400"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
