import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];

export type Reward = Tables["rewards"]["Row"];
export type RewardInsert = Tables["rewards"]["Insert"];
export type RewardUpdate = Tables["rewards"]["Update"];
export type RewardRedemption = Tables["reward_redemptions"]["Row"];

export type RewardWithCreator = Reward & {
  creator: { id: string; nickname: string };
};

export type RedemptionWithDetails = RewardRedemption & {
  reward: { id: string; title: string; cost_coins: number };
  redeemer: { id: string; nickname: string };
};

export type RedeemRewardResult = {
  redemption_id: string;
  coins_spent: number;
  remaining_coins: number;
  reward_title: string;
};
