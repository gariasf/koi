/**
 * Test-only session cookie for the mobile sync-torture tiers (Build Session
 * 6). Mirrors `packages/server/sync-tests/helpers.ts`'s `establishTestSession`
 * exactly, against the same test-only bootstrap endpoint
 * (`@koi/server`'s `auth/test-bootstrap.ts`, mounted only because
 * `global-setup.ts` passes `testBootstrap: true`). Never imported from `src/`
 * — the shipped app authenticates through `src/auth/client.ts` instead.
 */

const API = 'http://localhost:4000';

// Cached at module scope: every "device" in these scenarios shares the one
// bootstrap owner account anyway, and re-bootstrapping a fresh session on
// every mint call was pure added latency, not added correctness — enough to
// stretch a poll-based `waitFor` window on a slow run.
let cachedCookie: string | null = null;

export async function testSessionCookie(): Promise<string> {
  if (cachedCookie !== null) return cachedCookie;
  const res = await fetch(`${API}/api/auth/test/bootstrap-session`, { method: 'POST' });
  if (!res.ok) throw new Error(`test bootstrap HTTP ${res.status}`);
  const cookie = res.headers.get('set-cookie');
  if (cookie === null) throw new Error('test bootstrap returned no session cookie');
  cachedCookie = cookie.split(';')[0] ?? cookie;
  return cachedCookie;
}
