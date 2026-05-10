import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useCreateReward } from "../api/mutations";
import { RewardForm } from "../components/RewardForm";
import type { CreateRewardFormValues } from "../schemas";

export function RewardCreateScreen() {
  const router = useRouter();
  const { data: family } = useFamily();
  const createReward = useCreateReward();

  const handleSubmit = (values: CreateRewardFormValues) => {
    if (!family) return;

    createReward.mutate(
      {
        title: values.title,
        description: values.description || null,
        cost_coins: values.cost_coins,
        icon_url: values.icon_url,
        family_id: family.family_id,
        created_by: family.id,
      },
      {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not create reward"),
      },
    );
  };

  return (
    <RewardForm onSubmit={handleSubmit} isPending={createReward.isPending} />
  );
}
