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
 * Auth is the `KOI_DEV_AUTH` mint for now; better-auth (passkey-primary) replaces
 * `mintToken` wholesale and nothing else here changes.
 */

import type {
  CommonPowerSyncDatabase,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
} from '@powersync/common';

export interface KoiConnectorOptions {
  /** `http://host:4000` — the @koi/server write-path API. */
  readonly apiUrl: string;
  /** This device's stable id: the attribution key the server's ledger stores. */
  readonly deviceId: string;
  /** Dev-mint identity until better-auth lands. */
  readonly username?: string;
  /** Injectable for tests; defaults to the platform fetch. */
  readonly fetchImpl?: typeof fetch;
}

interface MintedToken {
  readonly token: string;
  readonly endpoint: string;
}

export class KoiConnector implements PowerSyncBackendConnector {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: KoiConnectorOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async mintToken(): Promise<MintedToken> {
    const res = await this.fetchImpl(`${this.options.apiUrl}/api/auth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: this.options.username ?? 'owner' }),
    });
    if (!res.ok) throw new Error(`token mint HTTP ${res.status}`);
    return (await res.json()) as MintedToken;
  }

  async fetchCredentials(): Promise<PowerSyncCredentials> {
    const { token, endpoint } = await this.mintToken();
    return { endpoint, token };
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

    const { token } = await this.mintToken();
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
  options: KoiConnectorOptions,
  batch: readonly Record<string, unknown>[],
): Promise<unknown> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const mint = await fetchImpl(`${options.apiUrl}/api/auth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: options.username ?? 'owner' }),
  });
  if (!mint.ok) throw new Error(`token mint HTTP ${mint.status}`);
  const { token } = (await mint.json()) as MintedToken;

  const res = await fetchImpl(`${options.apiUrl}/upload`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ deviceId: options.deviceId, batch }),
  });
  if (!res.ok) throw new Error(`peer upload HTTP ${res.status}`);
  return res.json();
}
