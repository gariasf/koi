import { Stack } from 'expo-router';

/**
 * History's own stack. Empty of pushes for now: record pages are batch 2, and they
 * will register here as a shared destination — the same page History, the Cost lens
 * and Home's Last-fill card all open, pushed inside whichever tab you were in.
 */
export default function HistoryStack(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
