import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";
import type { Badge, BadgeWithUnlock } from "../types";

export const badgeKeys = {
  all: () => ["badges"] as const,
  member: (memberId: string) => ["badges", "member", memberId] as const,
};

// ── Fetch all badges ──
async function fetchAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

// ── Fetch badges with unlock status for a member ──
async function fetchMemberBadges(
  memberId: string,
): Promise<BadgeWithUnlock[]> {
  // Get all badges
  const { data: badges, error: badgesError } = await supabase
    .from("badges")
    .select("*")
    .order("name");
  if (badgesError) throw badgesError;

  // Get this member's unlocks
  const { data: unlocks, error: unlocksError } = await supabase
    .from("badge_unlocks")
    .select("badge_id, unlocked_at")
    .eq("family_member_id", memberId);
  if (unlocksError) throw unlocksError;

  const unlockMap = new Map(
    unlocks.map((u) => [u.badge_id, u.unlocked_at]),
  );

  return badges.map((b) => ({
    ...b,
    unlocked_at: unlockMap.get(b.id) ?? null,
  }));
}

export function useAllBadges() {
  return useQuery({
    queryKey: badgeKeys.all(),
    queryFn: fetchAllBadges,
  });
}

export function useMemberBadges(memberId: string) {
  return useQuery({
    queryKey: badgeKeys.member(memberId),
    queryFn: () => fetchMemberBadges(memberId),
    enabled: !!memberId,
  });
}

export function useMyBadges() {
  const { data: family } = useFamily();
  return useMemberBadges(family?.id ?? "");
}
