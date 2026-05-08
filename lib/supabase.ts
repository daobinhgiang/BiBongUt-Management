/**
 * Supabase Client Configuration
 *
 * This module initializes the Supabase client for use throughout the app.
 *
 * Key setup details:
 *
 * 1. URL Polyfill — `react-native-url-polyfill/auto` must be imported before
 *    `createClient` to polyfill the URL API on native platforms (Android/iOS).
 *
 * 2. localStorage Polyfill — `expo-sqlite/localStorage/install` installs a
 *    synchronous SQLite-backed `localStorage` on native platforms. On web,
 *    the browser's built-in `localStorage` is used. This is the recommended
 *    approach by Supabase for Expo (replaces AsyncStorage).
 *
 * 3. Auth Storage — Uses `localStorage` (synchronous) which allows Supabase
 *    to persist sessions without async overhead. `autoRefreshToken` and
 *    `persistSession` are enabled for automatic token refresh.
 *
 * 4. Environment Variables — `EXPO_PUBLIC_` prefixed vars are inlined at
 *    build time by Expo. Never put secret keys (e.g. service_role) here.
 *
 * Usage:
 *   import { supabase } from "@/lib/supabase";
 *   const { data, error } = await supabase.from("table").select("*");
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/reactnative
 * @see https://docs.expo.dev/versions/latest/sdk/sqlite/#localstorage
 */

// Polyfills — must be imported before createClient
import "react-native-url-polyfill/auto";
import "@/lib/polyfills/install-localStorage";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase auth storage for Expo static web rendering: there is no `localStorage`
 * in Node during `expo export` / SSR, so referencing `localStorage` at module
 * load throws. Browser and native (after expo-sqlite install) use real storage.
 */
function getSupabaseAuthStorage() {
  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    try {
      const ls = (
        globalThis as typeof globalThis & { localStorage: Storage }
      ).localStorage;
      const probe = "__supabase_storage_probe__";
      ls.setItem(probe, probe);
      ls.removeItem(probe);
      return ls;
    } catch {
      /* private mode / storage unavailable */
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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getSupabaseAuthStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
