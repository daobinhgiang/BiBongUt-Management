import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useCreateChoreChart } from "../api/mutations";
import { ChoreChartForm } from "../components/ChoreChartForm";
import type { ChoreChartFormValues } from "../schemas";

export function ChoreChartCreateScreen() {
  const router = useRouter();
  const { data: family } = useFamily();
  const createChart = useCreateChoreChart();

  const handleSubmit = (values: ChoreChartFormValues) => {
    if (!family) return;

    createChart.mutate(
      { ...values, family_id: family.family_id, created_by: family.id },
      {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not create chore chart"),
      },
    );
  };

  return (
    <ChoreChartForm
      familyId={family?.family_id}
      onSubmit={handleSubmit}
      isPending={createChart.isPending}
    />
  );
}
