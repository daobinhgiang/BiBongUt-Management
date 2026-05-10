import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";
import { taskKeys } from "@/features/tasks/api/queries";
import { challengeKeys } from "./queries";
import type {
  ChallengeInsert,
  ChallengeWithDetails,
  LogContributionResult,
} from "../types";
import type { TaskDifficulty } from "@/features/tasks/types";
import { DIFFICULTY_DEFAULTS } from "@/features/tasks/types";

// ── Create challenge with tasks ──

type TaskInput = {
  title: string;
  difficulty: TaskDifficulty;
  damage: number;
};

type CreateChallengeInput = {
  challenge: ChallengeInsert;
  participantIds: string[];
  tasks: TaskInput[];
};

const CHALLENGE_FULL_SELECT = `
  *, creator:family_members!challenges_created_by_fkey(id, nickname),
  challenge_participants(
    *, member:family_members!challenge_participants_family_member_id_fkey(id, nickname, avatar_url)
  ),
  challenge_tasks(
    *, task:tasks!challenge_tasks_task_id_fkey(*)
  )
`;

async function createChallenge({
  challenge,
  participantIds,
  tasks,
}: CreateChallengeInput): Promise<ChallengeWithDetails> {
  // 1. Insert the challenge
  const { data, error } = await supabase
    .from("challenges")
    .insert({
      ...challenge,
      type: "boss_battle" as const,
      target_value: tasks.reduce((sum, t) => sum + t.damage, 0),
    })
    .select("id")
    .single();

  if (error) throw error;
  const challengeId = data.id;

  // 2. Add creator + selected participants
  const uniqueIds = [...new Set([challenge.created_by, ...participantIds])];
  const { error: partErr } = await supabase.from("challenge_participants").insert(
    uniqueIds.map((memberId) => ({
      challenge_id: challengeId,
      family_member_id: memberId,
      current_value: 0,
    }))
  );
  if (partErr) throw partErr;

  // 3. Create tasks and link them to the challenge
  for (const taskInput of tasks) {
    const defaults = DIFFICULTY_DEFAULTS[taskInput.difficulty];
    const { data: taskData, error: taskErr } = await supabase
      .from("tasks")
      .insert({
        title: taskInput.title,
        difficulty: taskInput.difficulty,
        points: defaults.points,
        coins_reward: defaults.coins,
        family_id: challenge.family_id,
        created_by: challenge.created_by,
        recurrence: "none" as const,
      })
      .select("id")
      .single();

    if (taskErr) throw taskErr;

    // Link task to challenge
    const { error: linkErr } = await supabase
      .from("challenge_tasks")
      .insert({
        challenge_id: challengeId,
        task_id: taskData.id,
        damage: taskInput.damage,
      });

    if (linkErr) throw linkErr;
  }

  // 4. Re-fetch full challenge
  const { data: full, error: err2 } = await supabase
    .from("challenges")
    .select(CHALLENGE_FULL_SELECT)
    .eq("id", challengeId)
    .single();

  if (err2) throw err2;
  return full as unknown as ChallengeWithDetails;
}

export function useCreateChallenge() {
  const qc = useQueryClient();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: createChallenge,
    onSuccess: (newChallenge) => {
      if (!family?.family_id) return;
      qc.setQueryData<ChallengeWithDetails[]>(
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

// ── Complete a challenge task (reuses complete_task RPC) ──

type CompleteTaskInput = {
  taskId: string;
  memberId: string;
  challengeId: string;
};

async function completeChallengeTask({ taskId, memberId }: CompleteTaskInput) {
  const { data, error } = await supabase.rpc("complete_task", {
    p_task_id: taskId,
    p_member_id: memberId,
  });
  if (error) throw error;
  return data;
}

export function useCompleteChallengeTask() {
  const qc = useQueryClient();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: completeChallengeTask,
    onSuccess: (_data, { challengeId }) => {
      // Invalidate both challenge and task caches
      qc.invalidateQueries({ queryKey: challengeKeys.detail(challengeId) });
      qc.invalidateQueries({ queryKey: challengeKeys.logs(challengeId) });
      if (family?.family_id) {
        qc.invalidateQueries({
          queryKey: challengeKeys.all(family.family_id),
        });
        qc.invalidateQueries({
          queryKey: taskKeys.all(family.family_id),
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
      const previous = qc.getQueryData<ChallengeWithDetails[]>(
        challengeKeys.all(family.family_id),
      );
      qc.setQueryData<ChallengeWithDetails[]>(
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
