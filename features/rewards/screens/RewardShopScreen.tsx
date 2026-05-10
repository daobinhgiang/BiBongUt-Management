import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  CurrencyCircleDollar,
  Plus,
  ClockCounterClockwise,
  Gift,
} from "phosphor-react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useRewards } from "../api/queries";
import { useRedeemReward, useDeleteReward } from "../api/mutations";
import { RewardCard } from "../components/RewardCard";
import type { RewardWithCreator, RedeemRewardResult } from "../types";

export function RewardShopScreen() {
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: rewards, isLoading } = useRewards();
  const redeemReward = useRedeemReward();
  const deleteReward = useDeleteReward();

  const isParent = family?.role === "parent";
  const myCoins = family?.coins ?? 0;

  function handleRedeem(reward: RewardWithCreator) {
    if (!family) return;

    Alert.alert(
      "Redeem Reward",
      `Spend ${reward.cost_coins} coins on "${reward.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: () => {
            redeemReward.mutate(
              { rewardId: reward.id, memberId: family.id },
              {
                onSuccess: (result: RedeemRewardResult) => {
                  Alert.alert(
                    "Redeemed!",
                    `You spent ${result.coins_spent} coins on ${result.reward_title}. ${result.remaining_coins} coins remaining.`,
                  );
                },
                onError: (err) => Alert.alert("Error", err.message),
              },
            );
          },
        },
      ],
    );
  }

  function handleDelete(reward: RewardWithCreator) {
    Alert.alert("Remove Reward", `Remove "${reward.title}" from the shop?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => deleteReward.mutate(reward.id),
      },
    ]);
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-100">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bark-100">
      {/* Coin balance header */}
      <View className="flex-row items-center justify-between border-b border-bark-100 bg-white px-4 py-3">
        <View className="flex-row items-center gap-2">
          <CurrencyCircleDollar size={24} color="#807200" weight="fill" />
          <Text className="text-lg font-bold text-bark-700">
            {myCoins} coins
          </Text>
        </View>
        {isParent && (
          <Pressable
            className="flex-row items-center gap-1"
            onPress={() => router.push("/(app)/rewards/history")}
          >
            <ClockCounterClockwise size={18} color="#819067" />
            <Text className="text-sm text-jungle-600">History</Text>
          </Pressable>
        )}
      </View>

      {(rewards?.length ?? 0) === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Gift size={48} color="#9ca3af" weight="duotone" />
          <Text className="mt-3 text-center text-base font-medium text-gray-500">
            No rewards yet.
            {isParent
              ? " Tap + to add rewards for the family."
              : " Ask a parent to add some!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rewards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerClassName="gap-3 px-4 pb-24 pt-4"
          columnWrapperClassName="gap-3"
          renderItem={({ item }) => (
            <RewardCard
              reward={item}
              myCoins={myCoins}
              onRedeem={() => handleRedeem(item)}
              isRedeeming={
                redeemReward.isPending &&
                redeemReward.variables?.rewardId === item.id
              }
              isParent={isParent}
              onEdit={
                isParent ? () => handleDelete(item) : undefined
              }
            />
          )}
        />
      )}

      {/* FAB — parents can add rewards */}
      {isParent && (
        <Pressable
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-jungle-500 shadow-lg"
          onPress={() => router.push("/(app)/rewards/new")}
        >
          <Plus size={28} color="#fff" weight="bold" />
        </Pressable>
      )}
    </View>
  );
}
