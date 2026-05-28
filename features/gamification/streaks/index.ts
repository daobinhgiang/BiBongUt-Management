import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { localToday } from "@/lib/date";
import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";

export const streakKeys = {
  member: (memberId: string) => ["streaks", memberId] as const,
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

  const today = localToday();
  const isAtRisk =
    data.current_streak > 0 && data.last_active_date !== today;

  return { ...data, is_at_risk: isAtRisk };
}

async function fetchAtRiskStreaks(
  familyId: string,
): Promise<{ id: string; nickname: string; current_streak: number }[]> {
  const today = localToday();
  const { data, error } = await supabase
    .from("family_members")
    .select("id, nickname, current_streak, last_active_date")
    .eq("family_id", familyId)
    .neq("role", "admin")
    .gt("current_streak", 0);

  if (error) throw error;

  return data.filter((m) => m.last_active_date !== today);
}

export function useStreak(memberId: string | undefined) {
  return useQuery({
    queryKey: streakKeys.member(memberId ?? ""),
    queryFn: () => fetchStreak(memberId!),
    enabled: !!memberId,
  });
}

export function useMyStreak() {
  const { data: member } = useCurrentMember();
  return useStreak(member?.id);
}

export function useAtRiskStreaks() {
  const { data: member } = useCurrentMember();
  return useQuery({
    queryKey: streakKeys.atRisk(member?.family_id ?? ""),
    queryFn: () => fetchAtRiskStreaks(member!.family_id),
    enabled: !!member?.family_id,
  });
}
