import { ActivityIndicator, Alert, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useChoreChart } from "../api/queries";
import { useUpdateChoreChart } from "../api/mutations";
import { ChoreChartForm } from "../components/ChoreChartForm";
import type { ChoreChartFormValues } from "../schemas";

export function ChoreChartEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: chart, isLoading } = useChoreChart(id);
  const updateChart = useUpdateChoreChart();

  if (isLoading || !chart) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleSubmit = (values: ChoreChartFormValues) => {
    updateChart.mutate(
      { ...values, chart_id: id },
      {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not update chore chart"),
      },
    );
  };

  return (
    <ChoreChartForm
      familyId={family?.family_id}
      onSubmit={handleSubmit}
      isPending={updateChart.isPending}
      submitLabel="Save Changes"
      initialValues={{
        title: chart.title,
        description: chart.description ?? undefined,
        difficulty: chart.difficulty,
        points: chart.points,
        coins_reward: chart.coins_reward,
        schedule_type: chart.schedule_type,
        slots: chart.chore_chart_slots.map((s) => ({
          day_of_week: s.day_of_week,
          assignee_id: s.assignee_id,
        })),
        rotation_members: chart.rotation_members,
      }}
    />
  );
}
