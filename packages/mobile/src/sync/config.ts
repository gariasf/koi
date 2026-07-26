/**
 * Where the app points, and what it is allowed to do to itself.
 *
 * `EXPO_PUBLIC_*` values are inlined into the bundle at build time, so they are
 * dev/build configuration only — never secrets. The API URL has to be reachable
 * *from the app's process*, which is not the same host in every case: the iOS
 * simulator shares the Mac's loopback, so `localhost:4000` works there, while a
 * physical phone needs the Mac's LAN address (and @koi/server bound to it — the
 * dev stack binds Postgres and PowerSync to loopback on purpose).
 */

const env = (key: string): string | undefined => {
  const value = process.env[key];
  return value === undefined || value === '' ? undefined : value;
};

/** The @koi/server write-path API. */
export const API_URL = env('EXPO_PUBLIC_KOI_API') ?? 'http://localhost:4000';

/**
 * Runs the S-6 / S-4 scenario suite on launch and renders the results, instead
 * of the app's own screens. Dev switch: it writes and deletes real records.
 */
export const SELFTEST = env('EXPO_PUBLIC_KOI_SELFTEST') === '1';
