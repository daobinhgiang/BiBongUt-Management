import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CalendarBlank, PlusIcon } from "phosphor-react-native";

import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { useChoreCharts } from "../api/queries";
import { ChoreChartCard } from "../components/ChoreChartCard";

export function ChoreChartListScreen() {
  const router = useRouter();
  const { data: member } = useCurrentMember();
  const { data: charts, isLoading } = useChoreCharts();
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bark-50">
      {!charts || charts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <CalendarBlank size={48} color="#9ca3af" weight="duotone" />
          <Text className="mt-3 text-center text-base font-medium text-gray-500">
            {"No chore charts yet.\nTap + to set up a weekly schedule."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={charts}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 px-4 pb-24 pt-4"
          renderItem={({ item }) => (
            <ChoreChartCard
              chart={item}
              onPress={() => router.push(`/(app)/chore-charts/${item.id}`)}
            />
          )}
        />
      )}

      {member != null && (
        <Pressable
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-jungle-500 shadow-lg"
          onPress={() => router.push("/(app)/chore-charts/new")}
        >
          <PlusIcon size={28} color="#fff" weight="bold" />
        </Pressable>
      )}
    </View>
  );
}
