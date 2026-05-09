import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";
import type { BucketListItemWithCreator, BucketListCompletionWithItem } from "../types";

const ITEM_SELECT =
  "*, creator:family_members!bucket_list_items_created_by_fkey(id, nickname)";

export const bucketListKeys = {
  all: (familyId: string) => ["bucket-list", familyId] as const,
  detail: (itemId: string) => ["bucket-list", "detail", itemId] as const,
  completion: (itemId: string) => ["bucket-list", "completion", itemId] as const,
  timeline: (familyId: string) => ["bucket-list", "timeline", familyId] as const,
};

// ── Fetch all bucket list items for the family ──
async function fetchBucketListItems(familyId: string): Promise<BucketListItemWithCreator[]> {
  const { data, error } = await supabase
    .from("bucket_list_items")
    .select(ITEM_SELECT)
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as BucketListItemWithCreator[];
}

// ── Fetch a single item by ID ──
async function fetchBucketListItem(itemId: string): Promise<BucketListItemWithCreator> {
  const { data, error } = await supabase
    .from("bucket_list_items")
    .select(ITEM_SELECT)
    .eq("id", itemId)
    .single();

  if (error) throw error;
  return data as unknown as BucketListItemWithCreator;
}

// ── Fetch completion for an item ──
async function fetchCompletion(itemId: string) {
  const { data, error } = await supabase
    .from("bucket_list_completions")
    .select("*")
    .eq("item_id", itemId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ── Fetch timeline (all completions with item info) ──
async function fetchTimeline(familyId: string): Promise<BucketListCompletionWithItem[]> {
  const { data, error } = await supabase
    .from("bucket_list_completions")
    .select("*, bucket_list_items!inner(title, category, family_id)")
    .eq("bucket_list_items.family_id", familyId)
    .order("completed_at", { ascending: false });

  if (error) throw error;
  return data as unknown as BucketListCompletionWithItem[];
}

// ── Hooks ──

export function useBucketListItems() {
  const { data: family } = useFamily();

  return useQuery({
    queryKey: bucketListKeys.all(family?.family_id ?? ""),
    queryFn: () => fetchBucketListItems(family!.family_id),
    enabled: !!family?.family_id,
  });
}

export function useBucketListItem(itemId: string) {
  return useQuery({
    queryKey: bucketListKeys.detail(itemId),
    queryFn: () => fetchBucketListItem(itemId),
    enabled: !!itemId,
  });
}

export function useBucketListCompletion(itemId: string) {
  return useQuery({
    queryKey: bucketListKeys.completion(itemId),
    queryFn: () => fetchCompletion(itemId),
    enabled: !!itemId,
  });
}

export function useTimeline() {
  const { data: family } = useFamily();

  return useQuery({
    queryKey: bucketListKeys.timeline(family?.family_id ?? ""),
    queryFn: () => fetchTimeline(family!.family_id),
    enabled: !!family?.family_id,
  });
}
