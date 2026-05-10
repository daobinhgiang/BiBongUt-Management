import type { ReactNode } from "react";
import { Pressable, ScrollView, View, Text } from "react-native";
import {
  Lightning,
  Trophy,
  User,
} from "phosphor-react-native";
import type { ChallengeFilter } from "../types";

const FILTERS: {
  key: ChallengeFilter;
  label: string;
  icon: (color: string) => ReactNode;
}[] = [
  {
    key: "active",
    label: "Active",
    icon: (c) => <Lightning size={14} color={c} />,
  },
  {
    key: "completed",
    label: "Done",
    icon: (c) => <Trophy size={14} color={c} />,
  },
  {
    key: "mine",
    label: "Mine",
    icon: (c) => <User size={14} color={c} />,
  },
];

type Props = {
  active: ChallengeFilter;
  onChange: (filter: ChallengeFilter) => void;
};

export function ChallengeFilterBar({ active, onChange }: Props) {
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
