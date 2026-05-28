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
 * - While the initial session is loading, the native splash screen stays visible
 *
 * Splash screen is held until both session AND family membership are resolved,
 * preventing the double-spinner waterfall.
 *
 * @see https://docs.expo.dev/router/reference/authentication/
 */
import "../global.css";

import * as SplashScreen from "expo-splash-screen";
import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { queryClient } from "@/lib/query-client";
import { SessionProvider, useSession } from "@/lib/auth/ctx";
import { DevModeSync } from "@/lib/stores/DevModeSync";
import { getMyFamily } from "@/features/families";

// Keep the native splash screen visible until we explicitly hide it
SplashScreen.preventAutoHideAsync();

/**
 * Auth gate — redirects users based on session state.
 * Holds splash screen until session + family data are resolved so the user
 * never sees a blank white screen or spinner waterfall.
 */
function AuthGate() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const router = useRouter();
  const splashHidden = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      // No session — go to login, hide splash
      const inAuthGroup = segmentsRef.current[0] === "(auth)";
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
      if (!splashHidden.current) {
        splashHidden.current = true;
        SplashScreen.hideAsync();
      }
      return;
    }

    // Session exists — prefetch family data FIRST, then navigate + hide splash
    const inAuthGroup = segmentsRef.current[0] === "(auth)";
    queryClient
      .prefetchQuery({
        queryKey: ["my-family", session.user.id],
        queryFn: () => getMyFamily(session.user.id),
      })
      .finally(() => {
        if (inAuthGroup) {
          router.replace("/(app)/(tabs)");
        }
        if (!splashHidden.current) {
          splashHidden.current = true;
          SplashScreen.hideAsync();
        }
      });
  }, [session, isLoading, router]);

  if (isLoading) {
    // Splash screen is still visible — render nothing (no spinner needed)
    return null;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <DevModeSync />
        <AuthGate />
      </SessionProvider>
    </QueryClientProvider>
  );
}
