import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { taskKeys } from "@/features/tasks/api/queries";
import { challengeKeys } from "./queries";
import type {
  ChallengeInsert,
  ChallengeWithDetails,
  LogContributionResult,
} from "../types";
import type { TaskDifficulty } from "@/features/tasks/types";

// ── Create challenge with tasks ──

type TaskInput = {
  title: string;
  difficulty: TaskDifficulty;
  damage: number;
  show_on_task_list?: boolean;
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
  const uniqueIds = [...new Set([challenge.created_by, ...participantIds])];

  const { data: challengeId, error } = await supabase.rpc("create_challenge", {
    p_family_id: challenge.family_id,
    p_created_by: challenge.created_by,
    p_title: challenge.title,
    p_boss_name: challenge.boss_name ?? "",
    p_boss_emoji: challenge.boss_emoji ?? "👹",
    p_template_id: challenge.template_id ?? "",
    p_reward_xp: challenge.reward_xp ?? 0,
    p_reward_coins: challenge.reward_coins ?? 0,
    p_end_date: challenge.end_date ?? undefined,
    p_participant_ids: uniqueIds,
    p_tasks: tasks.map((t) => ({
      title: t.title,
      difficulty: t.difficulty,
      damage: t.damage,
    })),
  });

  if (error) throw error;

  // Update show_on_task_list for any tasks that opted in.
  // The RPC created tasks in order, so fetch challenge_tasks to match by title.
  const tasksWithFlag = tasks.filter((t) => t.show_on_task_list);
  if (tasksWithFlag.length > 0) {
    const { data: ctRows } = await supabase
      .from("challenge_tasks")
      .select("id, task:tasks!challenge_tasks_task_id_fkey(title)")
      .eq("challenge_id", challengeId);

    if (ctRows) {
      const flagTitles = new Set(tasksWithFlag.map((t) => t.title));
      const idsToUpdate = (ctRows as any[])
        .filter((ct) => flagTitles.has(ct.task?.title))
        .map((ct) => ct.id);

      if (idsToUpdate.length > 0) {
        await supabase
          .from("challenge_tasks")
          .update({ show_on_task_list: true })
          .in("id", idsToUpdate);
      }
    }
  }

  // Re-fetch full challenge
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
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: createChallenge,
    onSuccess: (newChallenge) => {
      if (!member?.family_id) return;
      qc.setQueryData<ChallengeWithDetails[]>(
        challengeKeys.all(member.family_id),
        (old) => (old ? [newChallenge, ...old] : [newChallenge]),
      );
      qc.invalidateQueries({
        queryKey: taskKeys.challengeTasks(member.family_id),
      });
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
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: completeChallengeTask,
    onSuccess: (_data, { challengeId }) => {
      // Invalidate both challenge and task caches
      qc.invalidateQueries({ queryKey: challengeKeys.detail(challengeId) });
      qc.invalidateQueries({ queryKey: challengeKeys.logs(challengeId) });
      if (member?.family_id) {
        qc.invalidateQueries({
          queryKey: challengeKeys.all(member.family_id),
        });
        qc.invalidateQueries({
          queryKey: taskKeys.all(member.family_id),
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
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: deleteChallenge,
    onMutate: async (challengeId) => {
      if (!member?.family_id) return;
      await qc.cancelQueries({
        queryKey: challengeKeys.all(member.family_id),
      });
      const previous = qc.getQueryData<ChallengeWithDetails[]>(
        challengeKeys.all(member.family_id),
      );
      qc.setQueryData<ChallengeWithDetails[]>(
        challengeKeys.all(member.family_id),
        (old) => old?.filter((c) => c.id !== challengeId) ?? [],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (!member?.family_id || !context?.previous) return;
      qc.setQueryData(challengeKeys.all(member.family_id), context.previous);
    },
    onSettled: () => {
      if (!member?.family_id) return;
      qc.invalidateQueries({ queryKey: challengeKeys.all(member.family_id) });
    },
  });
}
