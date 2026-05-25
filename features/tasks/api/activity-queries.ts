import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type TaskActivity = {
  id: string;
  family_id: string;
  name: string;
  last_used_at: string;
};

export const activityKeys = {
  all: (familyId: string) => ["task_activities", familyId] as const,
};

async function fetchActivities(familyId: string): Promise<TaskActivity[]> {
  const { data, error } = await supabase
    .from("task_activities")
    .select("id, family_id, name, last_used_at")
    .eq("family_id", familyId)
    .order("last_used_at", { ascending: false });

  if (error) throw error;
  return data;
}

export function useTaskActivities(familyId: string | undefined) {
  return useQuery({
    queryKey: activityKeys.all(familyId ?? ""),
    queryFn: () => fetchActivities(familyId!),
    enabled: !!familyId,
  });
}
