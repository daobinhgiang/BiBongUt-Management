import { Text, View } from "react-native";
import { Skull } from "phosphor-react-native";

type Props = {
  current: number;
  target: number;
  unit: string;
};

function hpColor(pct: number): string {
  if (pct >= 60) return "bg-red-500";
  if (pct >= 30) return "bg-amber-500";
  return "bg-jungle-500";
}

export function BossHPBar({ current, target, unit }: Props) {
  const remaining = Math.max(target - current, 0);
  const hpPct = (remaining / target) * 100;
  const dmgPct = Math.min((current / target) * 100, 100);

  return (
    <View className="gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
      {/* Boss header */}
      <View className="flex-row items-center gap-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <Skull size={24} color="#dc2626" weight="fill" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-red-700">Boss HP</Text>
          <Text className="text-xs text-red-400">
            {remaining} / {target} {unit} remaining
          </Text>
        </View>
        <Text className="text-lg font-black text-red-600">
          {Math.round(hpPct)}%
        </Text>
      </View>

      {/* HP bar (inverted — shows remaining HP) */}
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
