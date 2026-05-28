import "@/lib/polyfills/install-localStorage";

export type SyncStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Synchronous key-value storage backed by expo-sqlite localStorage on native
 * and the browser localStorage on web. Falls back to in-memory only when
 * storage is unavailable (e.g. SSR during static export).
 */
export function getPersistentStorage(): SyncStorage {
  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    try {
      const ls = (globalThis as typeof globalThis & { localStorage: Storage })
        .localStorage;
      const probe = "__persistent_storage_probe__";
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
