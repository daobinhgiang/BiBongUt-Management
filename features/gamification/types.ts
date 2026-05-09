import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];

// ── Row types ──
export type Badge = Tables["badges"]["Row"];
export type BadgeUnlock = Tables["badge_unlocks"]["Row"];
export type Transaction = Tables["transactions"]["Row"];

// ── Joined types ──
export type BadgeWithUnlock = Badge & {
  unlocked_at: string | null;
};

export type TransactionWithMember = Transaction & {
  family_member: { id: string; nickname: string } | null;
};

export type LeaderboardEntry = {
  member_id: string;
  nickname: string;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  weekly_xp?: number;
};
