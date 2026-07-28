/**
 * The better-auth client (Build Session 6): passkey-primary, no email, no
 * password. Session storage rides `expo-secure-store` (Keychain-backed) via
 * `@better-auth/expo`'s client plugin, which is also what gives the app a
 * `getCookie()` accessor — native `fetch` keeps no cookie jar, so every
 * authenticated request (including `KoiConnector`'s PowerSync token mint,
 * `sync/connector.ts`) has to attach it manually.
 *
 * `expoPasskeyClient` (from `expo-better-auth-passkey`) is a drop-in
 * replacement for better-auth's own `passkeyClient`: same API
 * (`authClient.passkey.addPasskey`, `authClient.signIn.passkey`), but backed
 * by `ASAuthorizationController` on iOS / Credential Manager on Android
 * instead of the browser `navigator.credentials` API neither platform has.
 * See decisions.md (Session 6) for why this bridge specifically, and its
 * exit plan (D-022 niche-tool register).
 *
 * `authClient` is cast to a small hand-written interface rather than left on
 * `createAuthClient`'s inferred type: `@better-auth/expo` and
 * `@better-auth/passkey` each carry their own peer-resolved `better-auth`
 * instance under pnpm's strict peer isolation (`pnpm why @better-fetch/fetch`
 * shows two distinct "variations" of `better-auth@1.6.25` in this tree), so
 * the plugin array's generic inference collapses to the unaugmented base
 * client type at compile time even though the runtime composition is
 * correct — confirmed by running it. Narrowing here, once, is simpler and
 * more honest than fighting pnpm's peer graph for a compile-time-only
 * symptom.
 */

import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { expoPasskeyClient } from 'expo-better-auth-passkey';
import * as SecureStore from 'expo-secure-store';

import { API_URL } from '../sync/config';

interface AuthError {
  readonly message?: string;
}

interface KoiAuthClient {
  readonly getCookie: () => string;
  readonly passkey: {
    readonly addPasskey: (opts: { name?: string }) => Promise<{ error: AuthError | null }>;
  };
  readonly signIn: {
    readonly passkey: (opts?: { autoFill?: boolean }) => Promise<{ error: AuthError | null }>;
  };
  readonly $fetch: <T>(
    path: string,
    opts?: { readonly method?: string },
  ) => Promise<{ data: T | null; error: AuthError | null }>;
}

// `as any`: the plugin ARGUMENTS, not just the result, fail createAuthClient's
// generic constraint for the same peer-instance-duplication reason described
// above — `expoClient()`'s inferred type doesn't structurally match the
// `better-auth` instance `createAuthClient` itself resolved against, even
// though both are `better-auth@1.6.25`. `KoiAuthClient` below is the real,
// hand-checked contract.
const rawClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: 'koi',
      storagePrefix: 'koi',
      storage: SecureStore,
    }),
    expoPasskeyClient(),
  ],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);

export const authClient = rawClient as unknown as KoiAuthClient;

/** The header value KoiConnector needs to reach an authenticated route. */
export function getSessionCookie(): string {
  return authClient.getCookie();
}
