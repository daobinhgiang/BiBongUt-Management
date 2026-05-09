import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Sword, PlusIcon } from "phosphor-react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useChallenges, useCompletedChallenges } from "../api/queries";
import { ChallengeCard } from "../components/ChallengeCard";
import { ChallengeFilterBar } from "../components/ChallengeFilterBar";
import type { ChallengeFilter, ChallengeWithParticipants } from "../types";

function filterChallenges(
  challenges: ChallengeWithParticipants[],
  filter: ChallengeFilter,
  myMemberId: string | undefined,
): ChallengeWithParticipants[] {
  if (filter === "mine") {
    return challenges.filter((c) =>
      c.challenge_participants?.some(
        (p) => p.family_member_id === myMemberId,
      ),
    );
  }
  return challenges;
}

export function ChallengeListScreen() {
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: challenges, isLoading } = useChallenges();
  const { data: completedChallenges, isLoading: isLoadingDone } =
    useCompletedChallenges();
  const [filter, setFilter] = useState<ChallengeFilter>("active");

  const isCompletedFilter = filter === "completed";
  const sourceData = isCompletedFilter ? completedChallenges : challenges;

  const filtered = useMemo(
    () =>
      isCompletedFilter
        ? (completedChallenges ?? [])
        : filterChallenges(challenges ?? [], filter, family?.id),
    [challenges, completedChallenges, filter, family?.id, isCompletedFilter],
  );

  if (isLoading || (isCompletedFilter && isLoadingDone)) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-100">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bark-100">
      <ChallengeFilterBar active={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Sword size={48} color="#9ca3af" weight="duotone" />
          <Text className="mt-3 text-center text-base font-medium text-gray-500">
            {isCompletedFilter
              ? "No completed challenges yet."
              : (sourceData?.length ?? 0) === 0
                ? "No challenges yet. Tap + to create one."
                : "No challenges match that filter."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-2 px-4 pb-24 pt-4"
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              onPress={() =>
                router.push(`/(app)/challenges/${item.id}`)
              }
              myMemberId={family?.id}
            />
          )}
        />
      )}

      {/* FAB — any family member can create challenges */}
      {family != null && (
        <Pressable
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-jungle-500 shadow-lg"
          onPress={() => router.push("/(app)/challenges/new")}
        >
          <PlusIcon size={28} color="#fff" weight="bold" />
        </Pressable>
      )}
    </View>
  );
}
