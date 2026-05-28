import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { useCreateBucketListItem } from "../api/mutations";
import { BucketListForm } from "../components/BucketListForm";
import { PRIORITY_XP } from "../types";
import type { CreateBucketListFormValues } from "../schemas";

export function BucketListCreateScreen() {
  const router = useRouter();
  const { data: member } = useCurrentMember();
  const createItem = useCreateBucketListItem();

  const handleSubmit = (values: CreateBucketListFormValues) => {
    if (!member) return;

    createItem.mutate(
      {
        title: values.title,
        description: values.description || null,
        category: values.category,
        priority: values.priority,
        target_date: values.target_date,
        points: PRIORITY_XP[values.priority],
        family_id: member.family_id,
        created_by: member.id,
      },
      {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not create item"),
      },
    );
  };

  return <BucketListForm onSubmit={handleSubmit} isPending={createItem.isPending} />;
}
