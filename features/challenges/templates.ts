import type { TaskDifficulty } from "@/features/tasks/types";

export type BossTaskTemplate = {
  title: string;
  difficulty: TaskDifficulty;
  damage: number;
};

export type BossTaunt = {
  threshold: number; // HP% remaining (1.0 = full, 0 = defeated)
  text: string;
};

export type BossTemplate = {
  id: string;
  bossName: string;
  bossEmoji: string;
  title: string;
  description: string;
  tasks: BossTaskTemplate[];
  taunts: BossTaunt[];
  rewardXp: number;
  rewardCoins: number;
};

export const BOSS_TEMPLATES: BossTemplate[] = [
  {
    id: "clean_house_dragon",
    bossName: "Clean House Dragon",
    bossEmoji: "🐉",
    title: "Defeat the Clean House Dragon",
    description:
      "The dragon has made a mess! Complete all chores to defeat it.",
    tasks: [
      { title: "Make your bed", difficulty: "easy", damage: 1 },
      { title: "Vacuum the room", difficulty: "medium", damage: 2 },
      { title: "Wipe the counters", difficulty: "easy", damage: 1 },
      { title: "Take out the trash", difficulty: "easy", damage: 1 },
      { title: "Do the dishes", difficulty: "medium", damage: 2 },
    ],
    taunts: [
      { threshold: 1.0, text: "My mess is unstoppable! You'll never clean this!" },
      { threshold: 0.5, text: "Wait... where did my dust bunnies go?!" },
      { threshold: 0.25, text: "No! My beautiful mess! Stop cleaning!" },
      { threshold: 0, text: "The house... it sparkles... I'm defeated..." },
    ],
    rewardXp: 100,
    rewardCoins: 50,
  },
  {
    id: "reading_quest",
    bossName: "Book Monster",
    bossEmoji: "📚",
    title: "Reading Quest: Defeat the Book Monster",
    description:
      "The Book Monster fears knowledge! Read every day to weaken it.",
    tasks: [
      { title: "Read for 20 minutes (Day 1)", difficulty: "easy", damage: 1 },
      { title: "Read for 20 minutes (Day 2)", difficulty: "easy", damage: 1 },
      { title: "Read for 20 minutes (Day 3)", difficulty: "easy", damage: 1 },
      { title: "Read for 20 minutes (Day 4)", difficulty: "easy", damage: 1 },
      { title: "Read for 20 minutes (Day 5)", difficulty: "easy", damage: 1 },
    ],
    taunts: [
      { threshold: 1.0, text: "Books? Ha! Nobody reads anymore!" },
      { threshold: 0.5, text: "Wait, you're actually reading?!" },
      { threshold: 0.25, text: "All these words... they burn!" },
      { threshold: 0, text: "Knowledge... my only weakness... defeated!" },
    ],
    rewardXp: 75,
    rewardCoins: 35,
  },
  {
    id: "screen_free_goblin",
    bossName: "Screen Goblin",
    bossEmoji: "👾",
    title: "Screen-Free Weekend Challenge",
    description:
      "The Screen Goblin wants you glued to screens! Break free to defeat it.",
    tasks: [
      { title: "No screens before noon (Saturday)", difficulty: "medium", damage: 2 },
      { title: "Play a family board game", difficulty: "easy", damage: 1 },
      { title: "Outdoor activity together", difficulty: "medium", damage: 2 },
      { title: "No screens before noon (Sunday)", difficulty: "medium", damage: 2 },
    ],
    taunts: [
      { threshold: 1.0, text: "You can't resist the glow of the screen!" },
      { threshold: 0.5, text: "Wait... you're having fun WITHOUT screens?!" },
      { threshold: 0.25, text: "This can't be happening! Go back to your phones!" },
      { threshold: 0, text: "Real life... is actually... fun? I'm vanquished!" },
    ],
    rewardXp: 120,
    rewardCoins: 60,
  },
  {
    id: "healthy_week_troll",
    bossName: "Junk Food Troll",
    bossEmoji: "🧌",
    title: "Healthy Week: Defeat the Junk Food Troll",
    description:
      "The Troll feeds on bad habits! Build healthy ones to destroy it.",
    tasks: [
      { title: "Drink 8 cups of water", difficulty: "easy", damage: 1 },
      { title: "Eat a serving of vegetables", difficulty: "easy", damage: 1 },
      { title: "Exercise for 15 minutes", difficulty: "medium", damage: 2 },
      { title: "Brush teeth morning AND night", difficulty: "easy", damage: 1 },
      { title: "Go to bed on time", difficulty: "medium", damage: 2 },
    ],
    taunts: [
      { threshold: 1.0, text: "Vegetables?! Nobody eats those! Hahaha!" },
      { threshold: 0.5, text: "Ugh, is that WATER you're drinking?!" },
      { threshold: 0.25, text: "Stop being so healthy! I'm shrinking!" },
      { threshold: 0, text: "Too... much... health... I'm done for..." },
    ],
    rewardXp: 100,
    rewardCoins: 50,
  },
];

/** Get the appropriate taunt text based on remaining HP percentage */
export function getBossTaunt(
  hpPercent: number,
  taunts: BossTaunt[],
): string {
  // Sort by threshold descending, find first one where hpPercent <= threshold
  const sorted = [...taunts].sort((a, b) => a.threshold - b.threshold);
  for (const taunt of sorted) {
    if (hpPercent <= taunt.threshold) {
      return taunt.text;
    }
  }
  return taunts[0]?.text ?? "";
}
