/**
 * The PowerSync backend connector — the client end of the write-path contract
 * (`packages/server/README.md`). Three things here are load-bearing:
 *
 *  - **The wire shape.** `CrudEntry` → `{ op, type, id, data: opData, old: previousValues }`,
 *    posted as `{ deviceId, batch }`. `old` is the base_version echo that the
 *    per-column conflict analysis reads (D-037); dropping it would make every
 *    edit look baseless and turn same-column races into silent LWW.
 *  - **Throw on non-2xx.** The server accepts-with-2xx: content it cannot apply
 *    is dead-lettered and flagged *under a 200*. So a non-2xx means infra —
 *    unreachable, unauthenticated, or a transient Postgres contention the server
 *    deliberately re-raised (D-040) — and the ONLY correct response is to leave
 *    the transaction queued and let PowerSync retry it. Calling `tx.complete()`
 *    on a failure would discard a real write.
 *  - **One transaction per call.** `getNextCrudTransaction()` uploads exactly one
 *    client transaction, so the server sees the same atomic unit the client wrote
 *    (that is what makes the children-first car cascade land in one checkpoint).
 *
 * Auth is real (Build Session 6): a bearer token comes from better-auth's
 * `GET /api/auth/token`, which requires a session — this module never signs
 * anyone in, it only reads whatever session cookie `getSessionCookie` hands
 * it (the real app supplies `auth/client.ts`'s `authClient.getCookie()`; the
 * self-test/scenario harnesses supply their own, test-only source — see
 * `selftest/scenarios.ts` and `sync-tests/`). There is deliberately no
 * fallback path in this file for "no cookie yet": a connector with nothing to
 * authenticate with must fail the mint, not quietly find another way in.
 */

import type {
  CommonPowerSyncDatabase,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
} from '@powersync/common';

export interface KoiConnectorOptions {
  /** `http://host:4000` — the @koi/server write-path API. */
  readonly apiUrl: string;
  /** The PowerSync sync service itself — no longer implied by the token mint. */
  readonly powerSyncUrl: string;
  /** This device's stable id: the attribution key the server's ledger stores. */
  readonly deviceId: string;
  /** The current better-auth session cookie; empty/falsy when signed out. */
  readonly getSessionCookie: () => string | Promise<string>;
  /** Injectable for tests; defaults to the platform fetch. */
  readonly fetchImpl?: typeof fetch;
}

interface MintedToken {
  readonly token: string;
}

async function mintPowerSyncToken(
  fetchImpl: typeof fetch,
  apiUrl: string,
  getSessionCookie: KoiConnectorOptions['getSessionCookie'],
): Promise<string> {
  const cookie = await getSessionCookie();
  const res = await fetchImpl(`${apiUrl}/api/auth/token`, {
    headers: cookie ? { cookie } : {},
  });
  if (!res.ok) throw new Error(`token mint HTTP ${res.status}`);
  const { token } = (await res.json()) as MintedToken;
  return token;
}

export class KoiConnector implements PowerSyncBackendConnector {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: KoiConnectorOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async fetchCredentials(): Promise<PowerSyncCredentials> {
    const token = await mintPowerSyncToken(
      this.fetchImpl,
      this.options.apiUrl,
      this.options.getSessionCookie,
    );
    return { endpoint: this.options.powerSyncUrl, token };
  }

  async uploadData(database: CommonPowerSyncDatabase): Promise<void> {
    const tx = await database.getNextCrudTransaction();
    if (tx === null) return;

    const batch = tx.crud.map((entry) => ({
      op: entry.op,
      type: entry.table,
      id: entry.id,
      data: entry.opData,
      old: entry.previousValues,
    }));

    const token = await mintPowerSyncToken(
      this.fetchImpl,
      this.options.apiUrl,
      this.options.getSessionCookie,
    );
    const res = await this.fetchImpl(`${this.options.apiUrl}/upload`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ deviceId: this.options.deviceId, batch }),
    });
    // Non-2xx = infra, never content: keep the queue and let PowerSync retry.
    if (!res.ok) throw new Error(`upload HTTP ${res.status}`);

    await tx.complete();
  }
}

/**
 * Posts a batch as if it came from another device. This is what a peer's
 * connector does — same endpoint, same shape, different `deviceId` — and it is
 * how the on-device self-test produces real two-device races (a conflict needs a
 * second writer, and the write-path cannot tell this from a second phone).
 * Test/dev only: nothing in the app's own flows calls it.
 */
export async function uploadAsPeer(
  options: Pick<KoiConnectorOptions, 'apiUrl' | 'deviceId' | 'getSessionCookie' | 'fetchImpl'>,
  batch: readonly Record<string, unknown>[],
): Promise<unknown> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const token = await mintPowerSyncToken(fetchImpl, options.apiUrl, options.getSessionCookie);

  const res = await fetchImpl(`${options.apiUrl}/upload`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ deviceId: options.deviceId, batch }),
  });
  if (!res.ok) throw new Error(`peer upload HTTP ${res.status}`);
  return res.json();
}
