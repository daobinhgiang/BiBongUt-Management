import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useCreateChallenge } from "../api/mutations";
import { ChallengeForm } from "../components/ChallengeForm";
import type { CreateChallengeFormValues } from "../schemas";

export function ChallengeCreateScreen() {
  const router = useRouter();
  const { data: family } = useFamily();
  const createChallenge = useCreateChallenge();

  const handleSubmit = (values: CreateChallengeFormValues) => {
    if (!family) return;

    createChallenge.mutate(
      {
        challenge: {
          title: values.title,
          description: values.description || null,
          type: values.type,
          target_value: values.target_value,
          unit: values.unit,
          end_date: values.end_date,
          reward_xp: values.reward_xp,
          reward_coins: values.reward_coins,
          family_id: family.family_id,
          created_by: family.id,
        },
        participantIds: values.participant_ids,
      },
      {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not create challenge"),
      },
    );
  };

  return (
    <ChallengeForm
      onSubmit={handleSubmit}
      isPending={createChallenge.isPending}
      familyId={family?.family_id}
      creatorMemberId={family?.id}
    />
  );
}
