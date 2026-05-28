import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { bucketListKeys } from "./queries";
import type {
  BucketListItemInsert,
  BucketListItemUpdate,
  BucketListItemWithCreator,
} from "../types";

// ── Create item ──

async function createItem(item: BucketListItemInsert): Promise<BucketListItemWithCreator> {
  const { data, error } = await supabase
    .from("bucket_list_items")
    .insert(item)
    .select("*, creator:family_members!bucket_list_items_created_by_fkey(id, nickname)")
    .single();

  if (error) throw error;
  return data as unknown as BucketListItemWithCreator;
}

export function useCreateBucketListItem() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: createItem,
    onSuccess: (newItem) => {
      if (!member?.family_id) return;
      qc.setQueryData<BucketListItemWithCreator[]>(
        bucketListKeys.all(member.family_id),
        (old) => (old ? [newItem, ...old] : [newItem]),
      );
    },
  });
}

// ── Update item ──

type UpdateInput = { itemId: string; updates: BucketListItemUpdate };

async function updateItem({ itemId, updates }: UpdateInput): Promise<BucketListItemWithCreator> {
  const { data, error } = await supabase
    .from("bucket_list_items")
    .update(updates)
    .eq("id", itemId)
    .select("*, creator:family_members!bucket_list_items_created_by_fkey(id, nickname)")
    .single();

  if (error) throw error;
  return data as unknown as BucketListItemWithCreator;
}

export function useUpdateBucketListItem() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: updateItem,
    onSuccess: (updated) => {
      if (!member?.family_id) return;
      qc.setQueryData<BucketListItemWithCreator[]>(
        bucketListKeys.all(member.family_id),
        (old) => old?.map((i) => (i.id === updated.id ? updated : i)) ?? [],
      );
      qc.setQueryData(bucketListKeys.detail(updated.id), updated);
    },
  });
}

// ── Delete item ──

async function deleteItem(itemId: string) {
  const { error } = await supabase.from("bucket_list_items").delete().eq("id", itemId);
  if (error) throw error;
}

export function useDeleteBucketListItem() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: deleteItem,
    onMutate: async (itemId) => {
      if (!member?.family_id) return;
      await qc.cancelQueries({ queryKey: bucketListKeys.all(member.family_id) });
      const previous = qc.getQueryData<BucketListItemWithCreator[]>(
        bucketListKeys.all(member.family_id),
      );
      qc.setQueryData<BucketListItemWithCreator[]>(
        bucketListKeys.all(member.family_id),
        (old) => old?.filter((i) => i.id !== itemId) ?? [],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (!member?.family_id || !context?.previous) return;
      qc.setQueryData(bucketListKeys.all(member.family_id), context.previous);
    },
    onSettled: () => {
      if (!member?.family_id) return;
      qc.invalidateQueries({ queryKey: bucketListKeys.all(member.family_id) });
    },
  });
}

// ── Complete item (atomic RPC) ──

type CompleteInput = {
  itemId: string;
  location: string | null;
  photos: string[];
  notes: string | null;
  participants: string[];
};

async function completeItem(input: CompleteInput): Promise<string> {
  const { data, error } = await supabase.rpc("complete_bucket_list_item", {
    p_item_id: input.itemId,
    p_location: input.location ?? undefined,
    p_photos: input.photos,
    p_notes: input.notes ?? undefined,
    p_participants: input.participants,
  });

  if (error) throw error;
  return data as string;
}

export function useCompleteBucketListItem() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: completeItem,
    onSuccess: (_completionId, vars) => {
      if (!member?.family_id) return;
      qc.invalidateQueries({ queryKey: bucketListKeys.all(member.family_id) });
      qc.invalidateQueries({ queryKey: bucketListKeys.detail(vars.itemId) });
      qc.invalidateQueries({ queryKey: bucketListKeys.timeline(member.family_id) });
      // Refresh gamification data (XP, level, badges changed)
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["badges"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
