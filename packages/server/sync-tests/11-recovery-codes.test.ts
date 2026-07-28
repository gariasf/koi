/**
 * Recovery-code sign-in, proven end-to-end (Build Session 6, Goal 5).
 *
 * The client UI for ENTERING a recovery code doesn't exist yet (spec-delta.md
 * states this plainly) — this is the server-side proof the brief allows in
 * its place: generate real codes for a real session, redeem one with nothing
 * but the code itself, confirm the resulting session mints a real PowerSync
 * JWT exactly as a passkey sign-in would, and confirm the break-glass
 * properties that matter — single-use, and no standing hole for an invalid
 * guess.
 *
 * Session establishment here uses the test-only bootstrap
 * (`auth/test-bootstrap.ts`, mounted because `global-setup.ts` passes
 * `testBootstrap: true`) rather than a real passkey ceremony, for the same
 * reason every other scenario in this tier does: no WebAuthn authenticator
 * exists in a headless test process. What is under test is what happens
 * AFTER a session exists — recovery-code generation and redemption — not how
 * the session was first established.
 */

import { expect, it } from 'vitest';

import { API } from './helpers.js';

interface TokenResponse {
  readonly token: string;
}
interface RecoveryCodesResponse {
  readonly backupCodes: readonly string[];
}

async function bootstrapCookie(): Promise<string> {
  const res = await fetch(`${API}/api/auth/test/bootstrap-session`, { method: 'POST' });
  if (!res.ok) throw new Error(`test bootstrap HTTP ${res.status}`);
  const cookie = res.headers.get('set-cookie');
  if (cookie === null) throw new Error('test bootstrap returned no session cookie');
  return cookie.split(';')[0] ?? cookie;
}

it('generates 10 distinct recovery codes for a signed-in session', async () => {
  const cookie = await bootstrapCookie();
  const res = await fetch(`${API}/api/auth/recovery/generate`, {
    method: 'POST',
    headers: { cookie },
  });
  expect(res.status).toBe(200);
  const { backupCodes } = (await res.json()) as RecoveryCodesResponse;
  expect(backupCodes).toHaveLength(10);
  expect(new Set(backupCodes).size).toBe(10);
});

it('a valid recovery code signs in and mints a real PowerSync token — no session, no prior identification', async () => {
  const cookie = await bootstrapCookie();
  const genRes = await fetch(`${API}/api/auth/recovery/generate`, {
    method: 'POST',
    headers: { cookie },
  });
  const { backupCodes } = (await genRes.json()) as RecoveryCodesResponse;
  const code = backupCodes[0];
  if (code === undefined) throw new Error('no codes generated');

  // No cookie, no header identifying who this is — exactly what a device
  // that lost its passkey has to work with.
  const verifyRes = await fetch(`${API}/api/auth/recovery/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  expect(verifyRes.status).toBe(200);
  const recoveryCookie = verifyRes.headers.get('set-cookie');
  expect(recoveryCookie).not.toBeNull();

  const tokenRes = await fetch(`${API}/api/auth/token`, {
    headers: { cookie: recoveryCookie?.split(';')[0] ?? '' },
  });
  expect(tokenRes.status).toBe(200);
  const { token } = (await tokenRes.json()) as TokenResponse;
  expect(typeof token).toBe('string');
  expect(token.length).toBeGreaterThan(0);
});

it('a redeemed recovery code cannot be used again — single-use, not single-session', async () => {
  const cookie = await bootstrapCookie();
  const genRes = await fetch(`${API}/api/auth/recovery/generate`, {
    method: 'POST',
    headers: { cookie },
  });
  const { backupCodes } = (await genRes.json()) as RecoveryCodesResponse;
  const code = backupCodes[1];
  if (code === undefined) throw new Error('no codes generated');

  const first = await fetch(`${API}/api/auth/recovery/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  expect(first.status).toBe(200);

  const second = await fetch(`${API}/api/auth/recovery/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  expect(second.status).toBe(401);
});

it('an invalid recovery code is rejected, not silently accepted', async () => {
  const res = await fetch(`${API}/api/auth/recovery/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: 'NOTAREALCODE99' }),
  });
  expect(res.status).toBe(401);
});
