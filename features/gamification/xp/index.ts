import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "../types";

export const xpKeys = {
  activity: (memberId: string) =>
    ["xp", "activity", memberId] as const,
};

// ── Recent activity feed (last 20 transactions) ──
async function fetchRecentActivity(
  memberId: string,
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("family_member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

export function useRecentActivity(memberId: string) {
  return useQuery({
    queryKey: xpKeys.activity(memberId),
    queryFn: () => fetchRecentActivity(memberId),
    enabled: !!memberId,
  });
}
