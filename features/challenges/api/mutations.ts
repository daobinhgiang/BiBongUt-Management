import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";
import { challengeKeys } from "./queries";
import type {
  ChallengeInsert,
  ChallengeWithParticipants,
  LogContributionResult,
} from "../types";

// ── Create challenge ──

type CreateChallengeInput = {
  challenge: ChallengeInsert;
  participantIds: string[]; // additional member IDs to auto-join (creator is always joined)
};

const CHALLENGE_FULL_SELECT = `
  *, creator:family_members!challenges_created_by_fkey(id, nickname),
  challenge_participants(
    *, member:family_members!challenge_participants_family_member_id_fkey(id, nickname, avatar_url)
  )
`;

async function createChallenge({
  challenge,
  participantIds,
}: CreateChallengeInput): Promise<ChallengeWithParticipants> {
  // 1. Insert the challenge
  const { data, error } = await supabase
    .from("challenges")
    .insert(challenge)
    .select(CHALLENGE_FULL_SELECT)
    .single();

  if (error) throw error;

  // 2. Auto-join the creator
  await supabase.rpc("join_challenge", {
    p_challenge_id: data.id,
    p_member_id: challenge.created_by,
  });

  // 3. Join additional selected participants
  for (const memberId of participantIds) {
    if (memberId === challenge.created_by) continue; // already joined
    await supabase.rpc("join_challenge", {
      p_challenge_id: data.id,
      p_member_id: memberId,
    });
  }

  // 4. Re-fetch to get all participants
  const { data: full, error: err2 } = await supabase
    .from("challenges")
    .select(CHALLENGE_FULL_SELECT)
    .eq("id", data.id)
    .single();

  if (err2) throw err2;
  return full as unknown as ChallengeWithParticipants;
}

export function useCreateChallenge() {
  const qc = useQueryClient();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: createChallenge,
    onSuccess: (newChallenge) => {
      if (!family?.family_id) return;
      qc.setQueryData<ChallengeWithParticipants[]>(
        challengeKeys.all(family.family_id),
        (old) => (old ? [newChallenge, ...old] : [newChallenge]),
      );
    },
  });
}

// ── Join challenge ──

type JoinChallengeInput = {
  challengeId: string;
  memberId: string;
};

async function joinChallenge({ challengeId, memberId }: JoinChallengeInput) {
  const { error } = await supabase.rpc("join_challenge", {
    p_challenge_id: challengeId,
    p_member_id: memberId,
  });
  if (error) throw error;
}

export function useJoinChallenge() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: joinChallenge,
    onSuccess: (_data, { challengeId }) => {
      qc.invalidateQueries({ queryKey: challengeKeys.detail(challengeId) });
    },
  });
}

// ── Log contribution ──

type LogContributionInput = {
  challengeId: string;
  memberId: string;
  delta: number;
  note?: string;
};

async function logContribution({
  challengeId,
  memberId,
  delta,
  note,
}: LogContributionInput): Promise<LogContributionResult> {
  const { data, error } = await supabase.rpc("log_challenge_contribution", {
    p_challenge_id: challengeId,
    p_member_id: memberId,
    p_delta: delta,
    p_note: note,
  });
  if (error) throw error;
  return data as unknown as LogContributionResult;
}

export function useLogContribution() {
  const qc = useQueryClient();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: logContribution,
    onSuccess: (_data, { challengeId }) => {
      qc.invalidateQueries({ queryKey: challengeKeys.detail(challengeId) });
      qc.invalidateQueries({ queryKey: challengeKeys.logs(challengeId) });
      if (family?.family_id) {
        qc.invalidateQueries({
          queryKey: challengeKeys.all(family.family_id),
        });
      }
    },
  });
}

// ── Delete challenge ──

async function deleteChallenge(challengeId: string) {
  const { error } = await supabase
    .from("challenges")
    .delete()
    .eq("id", challengeId);
  if (error) throw error;
}

export function useDeleteChallenge() {
  const qc = useQueryClient();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: deleteChallenge,
    onMutate: async (challengeId) => {
      if (!family?.family_id) return;
      await qc.cancelQueries({
        queryKey: challengeKeys.all(family.family_id),
      });
      const previous = qc.getQueryData<ChallengeWithParticipants[]>(
        challengeKeys.all(family.family_id),
      );
      qc.setQueryData<ChallengeWithParticipants[]>(
        challengeKeys.all(family.family_id),
        (old) => old?.filter((c) => c.id !== challengeId) ?? [],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (!family?.family_id || !context?.previous) return;
      qc.setQueryData(challengeKeys.all(family.family_id), context.previous);
    },
    onSettled: () => {
      if (!family?.family_id) return;
      qc.invalidateQueries({ queryKey: challengeKeys.all(family.family_id) });
    },
  });
}
