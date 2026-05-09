/**
 * Authentication Context (SessionProvider)
 *
 * Provides authentication state and methods to the entire app via React Context.
 * Wraps Supabase Auth and listens for session changes (login, logout, token refresh).
 *
 * Architecture:
 * - `SessionProvider` wraps the app in `_layout.tsx`
 * - `useSession()` hook gives any component access to the current session and auth methods
 * - Auth state drives the Expo Router auth gate: authenticated users see (app), others see (auth)
 *
 * Session storage uses expo-sqlite/localStorage (synchronous, configured in lib/supabase.ts).
 *
 * Role-based access (parent vs child) will be determined by the user's profile in the
 * database — not by the auth session itself. This will be added when the data model is built.
 *
 * @see https://docs.expo.dev/router/reference/authentication/
 * @see https://supabase.com/docs/guides/auth
 */

import { createContext, useContext, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  /** Current Supabase session (null if not authenticated) */
  session: Session | null;
  /** Whether the initial session check is still loading */
  isLoading: boolean;
  /** Sign in with email and password */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Create a new account with email and password */
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  // --- Future auth methods (stubs) ---
  // signInWithGoogle: () => Promise<void>;
  // signInWithApple: () => Promise<void>;
  // sendPhoneOtp: (phone: string) => Promise<void>;
  // verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Hook to access the current auth session and methods.
 *
 * Must be used within a <SessionProvider>.
 *
 * @example
 * const { session, signOut } = useSession();
 * if (session) console.log("Logged in as", session.user.email);
 */
export function useSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSession must be used within a <SessionProvider>");
  }
  return context;
}

/**
 * Provides auth state to the component tree.
 *
 * Place this in the root layout (`app/_layout.tsx`) so all routes
 * can access the session via `useSession()`.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get the initial session on mount
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (__DEV__) console.log("[auth]", event);
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
