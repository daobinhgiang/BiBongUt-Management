import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import type { Badge, BadgeWithUnlock } from "../types";

export const badgeKeys = {
  all: () => ["badges"] as const,
  member: (memberId: string) => ["badges", "member", memberId] as const,
};

async function fetchAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

// Single query with left join — one round-trip instead of two
async function fetchMemberBadges(
  memberId: string,
): Promise<BadgeWithUnlock[]> {
  const { data, error } = await supabase
    .from("badges")
    .select("*, badge_unlocks!left(unlocked_at)")
    .eq("badge_unlocks.family_member_id", memberId)
    .order("name");

  if (error) throw error;

  return data.map((b) => {
    const unlocks = b.badge_unlocks as
      | { unlocked_at: string }[]
      | null;
    return {
      ...b,
      badge_unlocks: undefined,
      unlocked_at: unlocks?.[0]?.unlocked_at ?? null,
    } as BadgeWithUnlock;
  });
}

export function useAllBadges() {
  return useQuery({
    queryKey: badgeKeys.all(),
    queryFn: fetchAllBadges,
  });
}

export function useMemberBadges(memberId: string | undefined) {
  return useQuery({
    queryKey: badgeKeys.member(memberId ?? ""),
    queryFn: () => fetchMemberBadges(memberId!),
    enabled: !!memberId,
  });
}

export function useMyBadges() {
  const { data: member } = useCurrentMember();
  return useMemberBadges(member?.id);
}
