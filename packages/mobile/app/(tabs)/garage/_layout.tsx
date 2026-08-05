import { Stack } from 'expo-router';

/** Garage's own stack: the car page pushes inside it, tab bar intact. */
export default function GarageStack(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
