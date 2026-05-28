/**
 * tasks Feature
 *
 * Task Management — create, assign, and track household tasks.
 * Supports recurring tasks, due dates, priority levels, and XP rewards on completion.
 *
 * This barrel file re-exports hooks, components, and types for this feature.
 * Import from here: import { ... } from "@/features/tasks";
 */
export * from "./types";
export { useTasks, useTask, useCompletedTasks, useTaskCompletions, useChallengeTasks, taskKeys } from "./api/queries";
export { useCreateTask, useCompleteTask, useUpdateTask, useDeleteTask, useEnsureDailyHabits, useClaimDailyChest } from "./api/mutations";
export { useTaskActivities, activityKeys } from "./api/activity-queries";
export { useUpsertActivity } from "./api/activity-mutations";
