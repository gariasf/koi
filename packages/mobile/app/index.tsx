import { Redirect } from 'expo-router';

import { SELFTEST } from '../src/sync/config';

/**
 * The entry redirect. The four tabs live under `(tabs)`, whose URLs are `/home`,
 * `/history`, `/insights` and `/garage` — a group contributes no path segment, so
 * `/` needs somewhere to go and Home is where the app opens.
 *
 * Launching with `EXPO_PUBLIC_KOI_SELFTEST=1` goes straight to the S-6/S-4
 * scenarios instead, so a screenshot of a launched app stays the evidence that the
 * sync semantics hold on device.
 */
export default function Entry(): React.JSX.Element {
  return <Redirect href={SELFTEST ? '/selftest' : '/home'} />;
}
