import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Sword, Plus } from "phosphor-react-native";

import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { useChallenges } from "../api/queries";
import { ChallengeCard } from "../components/ChallengeCard";

export function ChallengeListScreen() {
  const router = useRouter();
  const { data: member } = useCurrentMember();
  const { data: challenges, isLoading } = useChallenges();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bark-50">
      {(challenges?.length ?? 0) === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Sword size={48} color="#9ca3af" weight="duotone" />
          <Text className="mt-3 text-center text-base font-medium text-gray-500">
            No challenges yet. Tap + to create one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-2 px-4 pb-24 pt-3"
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              onPress={() =>
                router.push(`/(app)/challenges/${item.id}`)
              }
              myMemberId={member?.id}
            />
          )}
        />
      )}

      {/* FAB — any family member can create challenges */}
      {member != null && (
        <Pressable
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-jungle-500 shadow-lg"
          onPress={() => router.push("/(app)/challenges/new")}
        >
          <Plus size={28} color="#fff" weight="bold" />
        </Pressable>
      )}
    </View>
  );
}
