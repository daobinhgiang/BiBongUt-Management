/**
 * App Group Layout
 *
 * Layout for authenticated screens. This group is only accessible
 * when there IS an active session. The auth gate in the root layout
 * handles the redirect logic.
 *
 * Contains the tab navigator as its primary child route.
 */
import { Stack } from "expo-router";

export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
