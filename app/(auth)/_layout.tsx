/**
 * Auth Group Layout
 *
 * Layout for unauthenticated screens (login, signup).
 * This group is only accessible when there is NO active session.
 * The auth gate in the root layout handles the redirect logic.
 *
 * Uses a Stack navigator with no header (auth screens manage their own UI).
 */
import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
