// `react-native-get-random-values` first, before anything can mint an id: uuid v7
// needs crypto.getRandomValues, which React Native does not ship.
import 'react-native-get-random-values';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { KoiProvider } from '../src/sync/provider';
import { color } from '../src/ui/theme';

export default function RootLayout(): React.JSX.Element {
  return (
    <KoiProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: color.paper },
          headerTintColor: color.ink,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: color.paper },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Garage' }} />
        <Stack.Screen name="car/[id]" options={{ title: 'Car' }} />
        <Stack.Screen name="review/index" options={{ title: 'Needs review' }} />
        <Stack.Screen name="review/[id]" options={{ title: 'Review' }} />
        <Stack.Screen name="selftest" options={{ title: 'Sync self-test' }} />
      </Stack>
    </KoiProvider>
  );
}
