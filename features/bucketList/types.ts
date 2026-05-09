import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

// ── Row types from generated schema ──
export type BucketListItem = Tables["bucket_list_items"]["Row"];
export type BucketListItemInsert = Tables["bucket_list_items"]["Insert"];
export type BucketListItemUpdate = Tables["bucket_list_items"]["Update"];
export type BucketListCompletion = Tables["bucket_list_completions"]["Row"];

// ── Enums ──
export type BucketListCategory = Enums["bucket_list_category"];
export type BucketListPriority = Enums["bucket_list_priority"];
export type BucketListStatus = Enums["bucket_list_status"];

// ── Joined query results ──
export type BucketListItemWithCreator = BucketListItem & {
  creator: { id: string; nickname: string };
};

export type BucketListCompletionWithItem = BucketListCompletion & {
  bucket_list_items: { title: string; category: BucketListCategory; family_id: string };
};

// ── Priority → XP mapping ──
export const PRIORITY_XP: Record<BucketListPriority, number> = {
  small: 50,
  medium: 150,
  large: 500,
};

// ── Category display config ──
export const CATEGORY_CONFIG: Record<
  BucketListCategory,
  { label: string; color: { bg: string; text: string } }
> = {
  travel: { label: "Travel", color: { bg: "bg-blue-100", text: "text-blue-700" } },
  experience: { label: "Experience", color: { bg: "bg-purple-100", text: "text-purple-700" } },
  skill: { label: "Skill", color: { bg: "bg-amber-100", text: "text-amber-700" } },
  other: { label: "Other", color: { bg: "bg-gray-100", text: "text-gray-600" } },
};

// ── Filter types ──
export type StatusFilter = "all" | BucketListStatus;
