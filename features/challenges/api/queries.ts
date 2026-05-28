import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import type {
  ChallengeWithDetails,
  ChallengeLogWithParticipant,
} from "../types";

const CHALLENGE_SELECT = `
  *,
  creator:family_members!challenges_created_by_fkey(id, nickname),
  challenge_participants(
    *,
    member:family_members!challenge_participants_family_member_id_fkey(id, nickname, avatar_url)
  ),
  challenge_tasks(
    *,
    task:tasks!challenge_tasks_task_id_fkey(*)
  )
`;

export const challengeKeys = {
  all: (familyId: string) => ["challenges", familyId] as const,
  completed: (familyId: string) =>
    ["challenges", "completed", familyId] as const,
  detail: (challengeId: string) =>
    ["challenges", "detail", challengeId] as const,
  logs: (challengeId: string) =>
    ["challenges", "logs", challengeId] as const,
};

async function fetchChallenges(
  familyId: string,
): Promise<ChallengeWithDetails[]> {
  const { data, error } = await supabase
    .from("challenges")
    .select(CHALLENGE_SELECT)
    .eq("family_id", familyId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as ChallengeWithDetails[];
}

async function fetchCompletedChallenges(
  familyId: string,
): Promise<ChallengeWithDetails[]> {
  const { data, error } = await supabase
    .from("challenges")
    .select(CHALLENGE_SELECT)
    .eq("family_id", familyId)
    .in("status", ["completed", "failed"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as unknown as ChallengeWithDetails[];
}

async function fetchChallenge(
  challengeId: string,
): Promise<ChallengeWithDetails> {
  const { data, error } = await supabase
    .from("challenges")
    .select(CHALLENGE_SELECT)
    .eq("id", challengeId)
    .single();

  if (error) throw error;
  return data as unknown as ChallengeWithDetails;
}

async function fetchChallengeLogs(
  challengeId: string,
): Promise<ChallengeLogWithParticipant[]> {
  const { data, error } = await supabase
    .from("challenge_logs")
    .select(
      `*, participant:challenge_participants!challenge_logs_participant_id_fkey(
        family_member_id,
        member:family_members!challenge_participants_family_member_id_fkey(id, nickname)
      )`,
    )
    .eq("challenge_id", challengeId)
    .order("logged_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data as unknown as ChallengeLogWithParticipant[];
}

// ── Hooks ──

export function useChallenges() {
  const { data: member } = useCurrentMember();

  return useQuery({
    queryKey: challengeKeys.all(member?.family_id ?? ""),
    queryFn: () => fetchChallenges(member!.family_id),
    enabled: !!member?.family_id,
  });
}

export function useCompletedChallenges() {
  const { data: member } = useCurrentMember();

  return useQuery({
    queryKey: challengeKeys.completed(member?.family_id ?? ""),
    queryFn: () => fetchCompletedChallenges(member!.family_id),
    enabled: !!member?.family_id,
  });
}

export function useChallenge(challengeId: string) {
  return useQuery({
    queryKey: challengeKeys.detail(challengeId),
    queryFn: () => fetchChallenge(challengeId),
    enabled: !!challengeId,
  });
}

export function useChallengeLogs(challengeId: string) {
  return useQuery({
    queryKey: challengeKeys.logs(challengeId),
    queryFn: () => fetchChallengeLogs(challengeId),
    enabled: !!challengeId,
  });
}
