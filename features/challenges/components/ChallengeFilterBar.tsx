import type { ReactNode } from "react";
import { Pressable, View, Text } from "react-native";
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
