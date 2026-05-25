import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { activityKeys } from "./activity-queries";

type UpsertActivityInput = {
  family_id: string;
  name: string;
};

async function upsertActivity({ family_id, name }: UpsertActivityInput) {
  const { error } = await supabase
    .from("task_activities")
    .upsert(
      { family_id, name, last_used_at: new Date().toISOString() },
      { onConflict: "family_id,name" },
    );

  if (error) throw error;
}

export function useUpsertActivity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: upsertActivity,
    onSuccess: (_data, { family_id }) => {
      qc.invalidateQueries({ queryKey: activityKeys.all(family_id) });
    },
  });
}
