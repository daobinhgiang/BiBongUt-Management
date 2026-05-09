import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";

export const streakKeys = {
  member: (memberId: string) => ["streak", memberId] as const,
  atRisk: (familyId: string) => ["streaks", "at-risk", familyId] as const,
};

type StreakInfo = {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  is_at_risk: boolean;
};

async function fetchStreak(memberId: string): Promise<StreakInfo> {
  const { data, error } = await supabase
    .from("family_members")
    .select("current_streak, longest_streak, last_active_date")
    .eq("id", memberId)
    .single();

  if (error) throw error;

  const today = new Date().toISOString().split("T")[0];
  const isAtRisk =
    data.current_streak > 0 && data.last_active_date !== today;

  return { ...data, is_at_risk: isAtRisk };
}

// ── Members with active streaks who haven't completed a task today ──
async function fetchAtRiskStreaks(
  familyId: string,
): Promise<{ id: string; nickname: string; current_streak: number }[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("family_members")
    .select("id, nickname, current_streak, last_active_date")
    .eq("family_id", familyId)
    .gt("current_streak", 0);

  if (error) throw error;

  return data.filter((m) => m.last_active_date !== today);
}

export function useStreak(memberId: string) {
  return useQuery({
    queryKey: streakKeys.member(memberId),
    queryFn: () => fetchStreak(memberId),
    enabled: !!memberId,
  });
}

export function useMyStreak() {
  const { data: family } = useFamily();
  return useStreak(family?.id ?? "");
}

export function useAtRiskStreaks() {
  const { data: family } = useFamily();
  return useQuery({
    queryKey: streakKeys.atRisk(family?.family_id ?? ""),
    queryFn: () => fetchAtRiskStreaks(family!.family_id),
    enabled: !!family?.family_id,
  });
}
