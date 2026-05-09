import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";

export type MemberProfile = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  role: string;
  level: number;
  total_xp: number;
  coins: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  family_id: string;
};

export const profileKeys = {
  member: (memberId: string) => ["profile", memberId] as const,
};

async function fetchMemberProfile(
  memberId: string,
): Promise<MemberProfile> {
  const { data, error } = await supabase
    .from("family_members")
    .select(
      "id, nickname, avatar_url, role, level, total_xp, coins, current_streak, longest_streak, last_active_date, family_id",
    )
    .eq("id", memberId)
    .single();

  if (error) throw error;
  return data;
}

export function useMemberProfile(memberId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.member(memberId ?? ""),
    queryFn: () => fetchMemberProfile(memberId!),
    enabled: !!memberId,
  });
}

export function useMyProfile() {
  const { data: family } = useFamily();
  return useMemberProfile(family?.id);
}
