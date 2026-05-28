import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { useCreateChoreChart } from "../api/mutations";
import { ChoreChartForm } from "../components/ChoreChartForm";
import type { ChoreChartFormValues } from "../schemas";

export function ChoreChartCreateScreen() {
  const router = useRouter();
  const { data: member } = useCurrentMember();
  const createChart = useCreateChoreChart();

  const handleSubmit = (values: ChoreChartFormValues) => {
    if (!member) return;

    createChart.mutate(
      { ...values, family_id: member.family_id, created_by: member.id },
      {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not create chore chart"),
      },
    );
  };

  return (
    <ChoreChartForm
      familyId={member?.family_id}
      onSubmit={handleSubmit}
      isPending={createChart.isPending}
    />
  );
}
