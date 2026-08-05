import { Stack } from 'expo-router';

/** Insights' own stack. The lens and page-size state live in the screen, not in
 * the route, so a tab switch preserves them while the stack still resets. */
export default function InsightsStack(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
