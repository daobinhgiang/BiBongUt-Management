import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { localWeekStart } from "@/lib/date";
import { useFamily } from "@/features/auth/hooks/useFamily";
import type { LeaderboardEntry } from "../types";

export const leaderboardKeys = {
  weekly: (familyId: string) => ["leaderboard", "weekly", familyId] as const,
  allTime: (familyId: string) =>
    ["leaderboard", "all-time", familyId] as const,
};

// ── Weekly leaderboard (XP earned this week) ──
async function fetchWeeklyLeaderboard(
  familyId: string,
): Promise<LeaderboardEntry[]> {
  const weekStart = localWeekStart();

  const { data: members, error: membersError } = await supabase
    .from("family_members")
    .select("id, nickname, avatar_url, total_xp, level, role")
    .eq("family_id", familyId)
    .neq("role", "admin");
  if (membersError) throw membersError;

  const { data: txns, error: txnError } = await supabase
    .from("transactions")
    .select("family_member_id, delta_xp")
    .in(
      "family_member_id",
      members.map((m) => m.id),
    )
    .gte("created_at", weekStart)
    .gt("delta_xp", 0);
  if (txnError) throw txnError;

  const weeklyXpMap = new Map<string, number>();
  for (const t of txns) {
    weeklyXpMap.set(
      t.family_member_id,
      (weeklyXpMap.get(t.family_member_id) ?? 0) + t.delta_xp,
    );
  }

  return members
    .map((m) => ({
      member_id: m.id,
      nickname: m.nickname,
      avatar_url: m.avatar_url,
      total_xp: m.total_xp,
      level: m.level,
      weekly_xp: weeklyXpMap.get(m.id) ?? 0,
    }))
    .sort((a, b) => (b.weekly_xp ?? 0) - (a.weekly_xp ?? 0));
}

// ── All-time leaderboard (total XP) ──
async function fetchAllTimeLeaderboard(
  familyId: string,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("family_members")
    .select("id, nickname, avatar_url, total_xp, level")
    .eq("family_id", familyId)
    .neq("role", "admin")
    .order("total_xp", { ascending: false });

  if (error) throw error;

  return data.map((m) => ({
    member_id: m.id,
    nickname: m.nickname,
    avatar_url: m.avatar_url,
    total_xp: m.total_xp,
    level: m.level,
  }));
}

export function useWeeklyLeaderboard() {
  const { data: family } = useFamily();
  return useQuery({
    queryKey: leaderboardKeys.weekly(family?.family_id ?? ""),
    queryFn: () => fetchWeeklyLeaderboard(family!.family_id),
    enabled: !!family?.family_id,
  });
}

export function useAllTimeLeaderboard() {
  const { data: family } = useFamily();
  return useQuery({
    queryKey: leaderboardKeys.allTime(family?.family_id ?? ""),
    queryFn: () => fetchAllTimeLeaderboard(family!.family_id),
    enabled: !!family?.family_id,
  });
}
