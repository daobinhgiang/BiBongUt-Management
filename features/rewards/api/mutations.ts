import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { profileKeys } from "@/features/gamification/api/profile";
import { rewardKeys } from "./queries";
import type {
  RewardInsert,
  RewardWithCreator,
  RedeemRewardResult,
} from "../types";

// ── Create reward (parent only) ──

async function createReward(
  reward: RewardInsert,
): Promise<RewardWithCreator> {
  const { data, error } = await supabase
    .from("rewards")
    .insert(reward)
    .select(
      "*, creator:family_members!rewards_created_by_fkey(id, nickname)",
    )
    .single();

  if (error) throw error;
  return data as unknown as RewardWithCreator;
}

export function useCreateReward() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: createReward,
    onSuccess: (newReward) => {
      if (!member?.family_id) return;
      qc.setQueryData<RewardWithCreator[]>(
        rewardKeys.all(member.family_id),
        (old) => (old ? [newReward, ...old] : [newReward]),
      );
    },
  });
}

// ── Delete reward (soft delete) ──

async function deleteReward(rewardId: string) {
  const { error } = await supabase
    .from("rewards")
    .update({ is_active: false })
    .eq("id", rewardId);
  if (error) throw error;
}

export function useDeleteReward() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: deleteReward,
    onMutate: async (rewardId) => {
      if (!member?.family_id) return;
      await qc.cancelQueries({
        queryKey: rewardKeys.all(member.family_id),
      });
      const previous = qc.getQueryData<RewardWithCreator[]>(
        rewardKeys.all(member.family_id),
      );
      qc.setQueryData<RewardWithCreator[]>(
        rewardKeys.all(member.family_id),
        (old) => old?.filter((r) => r.id !== rewardId) ?? [],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (!member?.family_id || !context?.previous) return;
      qc.setQueryData(rewardKeys.all(member.family_id), context.previous);
    },
    onSettled: () => {
      if (!member?.family_id) return;
      qc.invalidateQueries({ queryKey: rewardKeys.all(member.family_id) });
    },
  });
}

// ── Redeem reward (RPC) ──

type RedeemInput = { rewardId: string; memberId: string };

async function redeemReward({
  rewardId,
  memberId,
}: RedeemInput): Promise<RedeemRewardResult> {
  const { data, error } = await supabase.rpc("redeem_reward", {
    p_reward_id: rewardId,
    p_member_id: memberId,
  });
  if (error) throw error;
  return data as unknown as RedeemRewardResult;
}

export function useRedeemReward() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: redeemReward,
    onSuccess: () => {
      if (!member?.family_id) return;
      qc.invalidateQueries({
        queryKey: profileKeys.member(member.id),
      });
      qc.invalidateQueries({
        queryKey: rewardKeys.redemptions(member.family_id),
      });
      // Refresh the family query so coin balance updates in header
      qc.invalidateQueries({ queryKey: ["my-family"] });
    },
  });
}
