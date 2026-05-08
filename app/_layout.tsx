/**
 * Root Layout
 *
 * Top-level layout wrapping the entire app with global providers:
 *
 * 1. **global.css** — NativeWind/Tailwind styles (must be imported at root)
 * 2. **QueryClientProvider** — TanStack Query for server state management
 * 3. **SessionProvider** — Supabase auth context (session, sign-in/out methods)
 *
 * Auth Gate:
 * - `(app)` routes require an active session (redirect to login if not authenticated)
 * - `(auth)` routes require NO session (redirect to app if already authenticated)
 * - While the initial session is loading, a loading screen is shown
 *
 * @see https://docs.expo.dev/router/reference/authentication/
 */
import "../global.css";

import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import { queryClient } from "@/lib/query-client";
import { SessionProvider, useSession } from "@/lib/auth/ctx";

/**
 * Auth gate — redirects users based on session state.
 * Placed inside SessionProvider so it can access useSession().
 */
function AuthGate() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segmentsRef.current[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(app)/(tabs)");
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AuthGate />
      </SessionProvider>
    </QueryClientProvider>
  );
}
