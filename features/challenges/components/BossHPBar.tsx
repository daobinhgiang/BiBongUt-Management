import { Text, View } from "react-native";

type Props = {
  current: number;
  target: number;
  bossName?: string;
  bossEmoji?: string;
  tauntText?: string;
};

function hpColor(pct: number): string {
  if (pct >= 60) return "bg-red-500";
  if (pct >= 30) return "bg-amber-500";
  return "bg-jungle-500";
}

export function BossHPBar({
  current,
  target,
  bossName,
  bossEmoji = "👹",
  tauntText,
}: Props) {
  const remaining = Math.max(target - current, 0);
  const hpPct = target > 0 ? (remaining / target) * 100 : 0;
  const dmgPct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <View className="gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
      {/* Boss header */}
      <View className="items-center gap-2">
        <Text className="text-5xl">{bossEmoji}</Text>
        {bossName && (
          <Text className="text-lg font-black text-red-700">{bossName}</Text>
        )}
        {tauntText && (
          <Text className="text-center text-sm italic text-red-400">
            "{tauntText}"
          </Text>
        )}
      </View>

      {/* HP label */}
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-bold text-red-600">HP</Text>
        <Text className="text-xs text-red-400">
          {remaining} / {target}
        </Text>
        <Text className="text-sm font-black text-red-600">
          {Math.round(hpPct)}%
        </Text>
      </View>

      {/* HP bar */}
      <View className="h-5 overflow-hidden rounded-full bg-gray-200">
        <View
          className={`h-full rounded-full ${hpColor(hpPct)}`}
          style={{ width: `${hpPct}%` }}
        />
      </View>

      {/* Damage dealt */}
      <Text className="text-center text-xs font-medium text-red-500">
        {Math.round(dmgPct)}% damage dealt
      </Text>
    </View>
  );
}
