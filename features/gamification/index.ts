/**
 * gamification Feature
 *
 * Gamification — XP, levels, streaks, badges, quests, leaderboard, family level,
 * and titles. Core engagement system that rewards participation across all features.
 *
 * Sub-modules: xp, levels, streaks, badges, quests, leaderboard, familyLevel, titles
 *
 * This barrel file re-exports hooks, components, and types for this feature.
 * Import from here: import { ... } from "@/features/gamification";
 */
export * from "./types";
export {
  xpForLevel,
  levelFromXp,
  levelProgress,
  xpToNextLevel,
} from "./levels";
export {
  useAllBadges,
  useMemberBadges,
  useMyBadges,
  badgeKeys,
} from "./badges";
export {
  useStreak,
  useMyStreak,
  useAtRiskStreaks,
  streakKeys,
} from "./streaks";
export {
  useWeeklyLeaderboard,
  useAllTimeLeaderboard,
  leaderboardKeys,
} from "./leaderboard";
export { useRecentActivity, xpKeys } from "./xp";
export {
  useMemberProfile,
  useMyProfile,
  profileKeys,
} from "./api/profile";
export type { MemberProfile } from "./api/profile";
