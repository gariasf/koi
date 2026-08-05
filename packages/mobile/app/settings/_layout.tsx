import { Stack } from 'expo-router';

/**
 * Settings is **one task sheet with its own internal push stack** (sheet 06): Sync,
 * recovery codes and the review queue push *inside* it, back-only, so nothing here
 * is ever a second tall layer. Units and Appearance are fitted picks and fit in
 * place.
 *
 * `Review notes` is the second door to the review queue (D-058) — the same
 * destination Home pushes, registered again here so resolved items stay reachable
 * after Home has stopped rendering the entrance. A decision is part of the record,
 * not a deletion.
 */
export default function SettingsStack(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
