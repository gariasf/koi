// `react-native-get-random-values` first, before anything can mint an id: uuid v7
// needs crypto.getRandomValues, which React Native does not ship.
import 'react-native-get-random-values';

import { IBMPlexMono_400Regular, IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { KoiProvider, useKoi } from '../src/sync/provider';
import { KoiThemeProvider, useKoiTheme } from '../src/ui/theme';
import { ToastHost } from '../src/ui/toast';

void SplashScreen.preventAutoHideAsync();

/**
 * The app shell.
 *
 * Layer discipline (§D1): the root Stack holds the tab shell plus the **task
 * sheets** — Settings, the car form, capture. Push to go, sheet to do, fit to pick,
 * and never two tall layers: maximum depth anywhere is
 * `root → pushes → one task sheet → one fitted pick`.
 *
 * `StatusBar style="auto"` rather than the pinned `"dark"` the scaffold shipped:
 * `app.json` declares `userInterfaceStyle: automatic`, so a hard-coded dark status
 * bar was dark content on a dark ground in dark mode (D-059's third defect).
 *
 * The **data voice is bundled**, not named: IBM Plex Mono ships with the app because
 * `Menlo` is Apple-only and silently falls back to a proportional face on Android,
 * where the numbers would then jitter (amendments §C).
 */
export default function RootLayout(): React.JSX.Element | null {
  const [fontsLoaded] = useFonts({ IBMPlexMono_400Regular, IBMPlexMono_600SemiBold });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* The notch is a screen-level inset (`Root`), so the provider has to be above
          everything that draws one. */}
      <SafeAreaProvider>
        <KoiProvider>
          <Themed />
        </KoiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Inside `KoiProvider` because the appearance preference lives in `app_meta`. */
function Themed(): React.JSX.Element {
  const { db } = useKoi();
  return (
    <KoiThemeProvider db={db}>
      <ToastHost>
        <Shell />
      </ToastHost>
    </KoiThemeProvider>
  );
}

function Shell(): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.c.paper },
        }}
      >
        <Stack.Screen name="(tabs)" />
        {/* Task sheets. Each is one tall layer and carries its own header. */}
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="car-form" options={{ presentation: 'modal' }} />
        {/* Capture's chooser is not here, and that is the design's own rule rather
            than a gap: with zero cars `+` skips the chooser and opens the car form,
            and with exactly one buildable capture kind it skips it the same way. The
            chooser (a fitted sheet that dismisses itself and *then* opens the task
            sheet — a sequence, not a stack) arrives with the second capture surface,
            which is the first moment there is a choice to make. */}
        <Stack.Screen name="capture/odometer" options={{ presentation: 'modal' }} />
        <Stack.Screen name="selftest" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
