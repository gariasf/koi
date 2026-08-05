import { Stack } from 'expo-router';

/**
 * Home's own stack. A pushed page **keeps the tab bar** — that is what distinguishes
 * it from a sheet — and pops by path mutation only: `dismiss()` inside a pushed page
 * eventually rebinds to a sheet and kills Back (a hard-won bug, written down so it
 * is not re-found).
 *
 * The review queue is registered here *and* in Settings' stack. It is one
 * destination reachable from two places, never one route owned by one of them.
 */
export default function HomeStack(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
