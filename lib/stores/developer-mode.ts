import { create } from "zustand";

type DevModeState = {
  devMode: boolean;
  toggle: () => void;
};

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Safe localStorage accessor — on native the expo-sqlite polyfill may not
 * be installed yet when this module is first evaluated. Fall back to an
 * in-memory map so the store never blocks app startup.
 */
function safeStorage(): KeyValueStorage {
  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    try {
      const ls = (globalThis as typeof globalThis & { localStorage: Storage })
        .localStorage;
      const probe = "__dev_mode_probe__";
      ls.setItem(probe, probe);
      ls.removeItem(probe);
      return ls;
    } catch {
      /* storage unavailable */
    }
  }
  const memory: Record<string, string> = {};
  return {
    getItem: (key: string) => memory[key] ?? null,
    setItem: (key: string, value: string) => {
      memory[key] = value;
    },
    removeItem: (key: string) => {
      delete memory[key];
    },
  };
}

const STORAGE_KEY = "dev-mode-storage";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStoredDevMode(storage: KeyValueStorage): boolean {
  const raw = storage.getItem(STORAGE_KEY);
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

function writeStoredDevMode(storage: KeyValueStorage, devMode: boolean) {
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({ state: { devMode }, version: 0 }),
  );
}

const devModeStorage = safeStorage();

export const useDevModeStore = create<DevModeState>()((set, get) => ({
  devMode: readStoredDevMode(devModeStorage),
  toggle: () => {
    const devMode = !get().devMode;
    writeStoredDevMode(devModeStorage, devMode);
    set({ devMode });
  },
}));

export const useDevMode = () => useDevModeStore((s) => s.devMode);
