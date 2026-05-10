import { Pressable, Text, View } from "react-native";
import { CurrencyCircleDollar } from "phosphor-react-native";
import type { RewardWithCreator } from "../types";

type Props = {
  reward: RewardWithCreator;
  myCoins: number;
  onRedeem: () => void;
  isRedeeming: boolean;
  isParent: boolean;
  onEdit?: () => void;
};

export function RewardCard({
  reward,
  myCoins,
  onRedeem,
  isRedeeming,
  isParent,
  onEdit,
}: Props) {
  const canAfford = myCoins >= reward.cost_coins;

  return (
    <View className="flex-1 gap-2 rounded-2xl border border-bark-50 bg-white p-4 shadow-sm">
      {/* Icon */}
      <Text className="text-3xl">
        {reward.icon_url || "🎁"}
      </Text>

      {/* Title */}
      <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
        {reward.title}
      </Text>

      {/* Description */}
      {reward.description && (
        <Text className="text-xs text-gray-400" numberOfLines={2}>
          {reward.description}
        </Text>
      )}

      {/* Cost */}
      <View className="flex-row items-center gap-1">
        <CurrencyCircleDollar size={16} color="#807200" weight="fill" />
        <Text className="text-sm font-bold text-bark-600">
          {reward.cost_coins}
        </Text>
      </View>

      {/* Redeem button */}
      <Pressable
        className={`mt-auto items-center rounded-lg py-2 ${
          canAfford && !isRedeeming
            ? "bg-jungle-500"
            : "bg-bark-200"
        }`}
        onPress={onRedeem}
        disabled={!canAfford || isRedeeming}
      >
        <Text
          className={`text-xs font-semibold ${
            canAfford && !isRedeeming ? "text-white" : "text-gray-400"
          }`}
        >
          {isRedeeming
            ? "Redeeming..."
            : canAfford
              ? "Redeem"
              : "Not enough coins"}
        </Text>
      </Pressable>

      {/* Edit link for parents */}
      {isParent && onEdit && (
        <Pressable onPress={onEdit}>
          <Text className="text-center text-xs text-jungle-500">Edit</Text>
        </Pressable>
      )}
    </View>
  );
}
