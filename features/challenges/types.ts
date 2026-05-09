import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

// ── Row types from generated schema ──
export type Challenge = Tables["challenges"]["Row"];
export type ChallengeInsert = Tables["challenges"]["Insert"];
export type ChallengeUpdate = Tables["challenges"]["Update"];
export type ChallengeParticipant = Tables["challenge_participants"]["Row"];
export type ChallengeLog = Tables["challenge_logs"]["Row"];

// ── Enums ──
export type ChallengeType = Enums["challenge_type"];
export type ChallengeStatus = Enums["challenge_status"];

// ── Joined query results ──
export type ParticipantWithMember = ChallengeParticipant & {
  member: { id: string; nickname: string; avatar_url: string | null };
};

export type ChallengeWithParticipants = Challenge & {
  creator: { id: string; nickname: string };
  challenge_participants: ParticipantWithMember[];
};

export type ChallengeLogWithParticipant = ChallengeLog & {
  participant: {
    family_member_id: string;
    member: { id: string; nickname: string };
  };
};

// ── RPC result ──
export type LogContributionResult = {
  new_value: number;
  challenge_complete: boolean;
  challenge_type: string;
  target_value: number;
  reward_xp: number;
  reward_coins: number;
  total_value?: number;
  error?: string;
  status?: string;
};

// ── Filter ──
export type ChallengeFilter = "active" | "completed" | "mine";

// ── Type display helpers ──
export const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  solo: "Solo",
  collaborative: "Team",
  boss_battle: "Boss Battle",
};
