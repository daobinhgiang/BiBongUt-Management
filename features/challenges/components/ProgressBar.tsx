import { Text, View } from "react-native";

type Props = {
  current: number;
  target: number;
  unit: string;
  color?: string;
  label?: string;
};

export function ProgressBar({
  current,
  target,
  unit,
  color = "bg-jungle-500",
  label,
}: Props) {
  const pct = Math.min((current / target) * 100, 100);

  return (
    <View className="gap-1">
      {label && (
        <Text className="text-xs font-medium text-gray-500">{label}</Text>
      )}
      <View className="h-3 overflow-hidden rounded-full bg-bark-100">
        <View
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </View>
      <Text className="text-xs text-gray-400">
        {current} / {target} {unit} ({Math.round(pct)}%)
      </Text>
    </View>
  );
}
