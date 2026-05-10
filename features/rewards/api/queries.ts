import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";
import type { RewardWithCreator, RedemptionWithDetails } from "../types";

const REWARD_SELECT =
  "*, creator:family_members!rewards_created_by_fkey(id, nickname)";

export const rewardKeys = {
  all: (familyId: string) => ["rewards", familyId] as const,
  redemptions: (familyId: string) =>
    ["rewards", "redemptions", familyId] as const,
};

async function fetchRewards(
  familyId: string,
): Promise<RewardWithCreator[]> {
  const { data, error } = await supabase
    .from("rewards")
    .select(REWARD_SELECT)
    .eq("family_id", familyId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as RewardWithCreator[];
}

async function fetchRedemptions(
  familyId: string,
): Promise<RedemptionWithDetails[]> {
  const { data, error } = await supabase
    .from("reward_redemptions")
    .select(
      `*,
       reward:rewards!reward_redemptions_reward_id_fkey(id, title, cost_coins),
       redeemer:family_members!reward_redemptions_redeemed_by_fkey(id, nickname)`,
    )
    .order("redeemed_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as unknown as RedemptionWithDetails[];
}

export function useRewards() {
  const { data: family } = useFamily();

  return useQuery({
    queryKey: rewardKeys.all(family?.family_id ?? ""),
    queryFn: () => fetchRewards(family!.family_id),
    enabled: !!family?.family_id,
  });
}

export function useRedemptionHistory() {
  const { data: family } = useFamily();

  return useQuery({
    queryKey: rewardKeys.redemptions(family?.family_id ?? ""),
    queryFn: () => fetchRedemptions(family!.family_id),
    enabled: !!family?.family_id,
  });
}
