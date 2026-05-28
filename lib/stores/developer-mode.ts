import { create } from "zustand";

import { getPersistentStorage } from "@/lib/persistent-storage";

const STORAGE_KEY = "dev-mode-by-user";
const LEGACY_STORAGE_KEY = "dev-mode-storage";

type DevModePrefs = Record<string, boolean>;

type DevModeState = {
  devMode: boolean;
  userId: string | null;
  setUserId: (userId: string | null) => void;
  toggle: () => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readPrefs(): DevModePrefs {
  const raw = getPersistentStorage().getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};

    const prefs: DevModePrefs = {};
    for (const [userId, enabled] of Object.entries(parsed)) {
      if (enabled === true) prefs[userId] = true;
    }
    return prefs;
  } catch {
    return {};
  }
}

function writePrefs(prefs: DevModePrefs) {
  getPersistentStorage().setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function readLegacyDevMode(): boolean {
  const raw = getPersistentStorage().getItem(LEGACY_STORAGE_KEY);
  if (!raw) return false;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return false;

    const state = parsed.state;
    if (!isRecord(state)) return false;

    return state.devMode === true;
  } catch {
    return false;
  }
}

function readDevModeForUser(userId: string): boolean {
  const prefs = readPrefs();
  if (userId in prefs) return prefs[userId] === true;

  // One-time migration from the old single-user storage key.
  const legacy = readLegacyDevMode();
  if (legacy) {
    writePrefs({ ...prefs, [userId]: true });
    getPersistentStorage().removeItem(LEGACY_STORAGE_KEY);
    return true;
  }

  return false;
}

function writeDevModeForUser(userId: string, devMode: boolean) {
  writePrefs({ ...readPrefs(), [userId]: devMode });
}

export const useDevModeStore = create<DevModeState>()((set, get) => ({
  devMode: false,
  userId: null,
  setUserId: (userId) => {
    set({
      userId,
      devMode: userId ? readDevModeForUser(userId) : false,
    });
  },
  toggle: () => {
    const { userId, devMode } = get();
    if (!userId) return;

    const next = !devMode;
    writeDevModeForUser(userId, next);
    set({ devMode: next });
  },
}));

export const useDevMode = () => useDevModeStore((s) => s.devMode);
