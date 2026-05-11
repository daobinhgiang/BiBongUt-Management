import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
} from "react-native";
import {
  CurrencyCircleDollar,
  ClockCounterClockwise,
} from "phosphor-react-native";

import { useRedemptionHistory } from "../api/queries";
import type { RedemptionWithDetails } from "../types";

export function RewardHistoryScreen() {
  const { data: redemptions, isLoading } = useRedemptionHistory();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if ((redemptions?.length ?? 0) === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50 px-8">
        <ClockCounterClockwise size={48} color="#9ca3af" weight="duotone" />
        <Text className="mt-3 text-center text-base font-medium text-gray-500">
          No redemptions yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bark-50">
      <FlatList
        data={redemptions}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-2 px-4 pb-8 pt-4"
        renderItem={({ item }) => (
          <RedemptionRow redemption={item} />
        )}
      />
    </View>
  );
}

function RedemptionRow({
  redemption,
}: {
  redemption: RedemptionWithDetails;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold text-gray-900">
          {redemption.reward?.title ?? "Unknown reward"}
        </Text>
        <Text className="text-xs text-gray-500">
          Redeemed by{" "}
          <Text className="font-medium text-jungle-600">
            {redemption.redeemer?.nickname ?? "Unknown"}
          </Text>
        </Text>
        <Text className="text-[10px] text-gray-300">
          {new Date(redemption.redeemed_at).toLocaleDateString()}
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        <CurrencyCircleDollar size={16} color="#807200" weight="fill" />
        <Text className="text-sm font-bold text-bark-600">
          -{redemption.coins_spent}
        </Text>
      </View>
    </View>
  );
}
