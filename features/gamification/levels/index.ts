// Level formula mirrors Postgres: level = floor(sqrt(total_xp / 100)) + 1

/** XP required to reach a given level */
export function xpForLevel(level: number): number {
  // level = floor(sqrt(xp / 100)) + 1
  // level - 1 = floor(sqrt(xp / 100))
  // (level - 1)^2 * 100 = xp threshold
  return Math.pow(level - 1, 2) * 100;
}

/** Calculate level from total XP */
export function levelFromXp(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

/** Progress within current level (0 to 1) */
export function levelProgress(totalXp: number): number {
  const level = levelFromXp(totalXp);
  const currentThreshold = xpForLevel(level);
  const nextThreshold = xpForLevel(level + 1);
  const range = nextThreshold - currentThreshold;
  if (range === 0) return 1;
  return (totalXp - currentThreshold) / range;
}

/** XP remaining to reach next level */
export function xpToNextLevel(totalXp: number): number {
  const level = levelFromXp(totalXp);
  const nextThreshold = xpForLevel(level + 1);
  return nextThreshold - totalXp;
}
