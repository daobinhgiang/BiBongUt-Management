/**
 * useAuth Hook
 *
 * Convenience re-export of useSession from the auth context.
 * Provides the current session, loading state, and auth methods.
 *
 * Usage:
 *   import { useAuth } from "@/features/auth/hooks/useAuth";
 *   const { session, signOut, isLoading } = useAuth();
 *
 * This hook is the primary way feature modules should access auth state.
 * It abstracts over the context implementation so the auth internals
 * can change without affecting consumers.
 */
export { useSession as useAuth } from "@/lib/auth/ctx";
