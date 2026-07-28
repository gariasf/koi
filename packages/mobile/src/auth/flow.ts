/**
 * The passkey sign-in/registration flow "Turn on sync" triggers (Build
 * Session 6; the placement decision is recorded in spec-delta.md).
 *
 * There is no separate "sign in" screen before sync: tapping the toggle
 * tries registration first (which only succeeds once — the founding passkey,
 * guarded server-side in `auth/instance.ts`'s `resolveUser`), and falls back
 * to signing in with an existing passkey when the account already has one
 * (a second device, or the same device re-registering after being signed
 * out). A device that can do neither — the account's only passkey lives
 * somewhere this device's iCloud Keychain cannot reach — has no in-app way
 * back in yet: recovery-code entry is proven server-side only this session
 * (Goal 5, spec-delta.md), not built as a screen, so that case surfaces as a
 * plain error rather than a silent retry loop.
 */

import { Platform } from 'react-native';

import { authClient } from './client';

export interface SignInOutcome {
  /** True only when this call minted the account's FOUNDING passkey. */
  readonly registered: boolean;
}

const DEVICE_LABEL = `Koi (${Platform.OS})`;

/**
 * `authClient.getCookie()` is not a proxy for "already signed in" — better-
 * auth's Expo client stores every cookie whose name matches its prefix, and
 * that includes the SHORT-LIVED WebAuthn challenge cookie a passkey attempt
 * sets before the ceremony even completes. A cookie jar that is merely
 * non-empty can be nothing but that leftover from a previous, abandoned
 * attempt — checked here directly against the server instead of inferred
 * from cookie presence (found the hard way: a stale challenge cookie made
 * this function skip straight past the passkey ceremony entirely, and the
 * resulting "signed in" was actually signed into nothing).
 */
async function hasValidSession(): Promise<boolean> {
  const { data } = await authClient.$fetch<{ session: unknown } | null>('/get-session');
  return data != null;
}

export async function ensureSignedIn(): Promise<SignInOutcome> {
  if (await hasValidSession()) return { registered: false };

  // Registering a passkey does NOT sign you in: better-auth's passkey plugin
  // calls `createSession` in exactly one place — the AUTHENTICATION path
  // (`verify-authentication`). `verify-registration` only stores the
  // credential. So a fresh device always needs both steps, and the sign-in
  // below is not a fallback for a failed registration — it is the second
  // half of a successful one. (Found the hard way: registration succeeded,
  // the passkey row existed, and every subsequent token mint 401'd because
  // there was no session behind it.)
  const register = await authClient.passkey.addPasskey({ name: DEVICE_LABEL });
  const registered = !register.error;

  const signIn = await authClient.signIn.passkey();
  if (signIn.error) {
    throw new Error(
      signIn.error.message ??
        (registered
          ? 'Registered a passkey but could not sign in with it.'
          : 'Could not sign in with a passkey — this account may have one on another device only.'),
    );
  }
  return { registered };
}

interface GenerateRecoveryCodesResponse {
  readonly backupCodes: readonly string[];
}

/** Shown to the user exactly once, right after a fresh registration. */
export async function generateRecoveryCodes(): Promise<readonly string[]> {
  const { data, error } = await authClient.$fetch<GenerateRecoveryCodesResponse>(
    '/recovery/generate',
    { method: 'POST' },
  );
  if (error !== null || !data) {
    throw new Error(error?.message ?? 'Could not generate recovery codes.');
  }
  return data.backupCodes;
}
