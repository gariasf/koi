/**
 * The upload pipeline. One Postgres transaction per client batch — a client
 * transaction is atomic as observed by peers — with a SAVEPOINT per op so a
 * failing op never poisons its siblings and its dead letter can still be
 * written after rollback.
 *
 * The accept-with-2xx contract (D-022): a well-formed batch ALWAYS commits
 * and returns 200. Ops the server cannot apply are preserved in
 * dead_letters with their full payload and surfaced through a synced flag,
 * in the same commit — never rejected (which would wedge the client's
 * queue), never skipped (which would be silent data loss the moment the
 * client clears its queue).
 *
 * Dead letters are idempotent under retry: ids are a content hash of the
 * op + device, so a batch replayed after a lost 200 lands on the same rows
 * (ON CONFLICT DO NOTHING) instead of duplicating dead letters and
 * user-facing flags. Content-identical repeats of a genuinely re-issued op
 * coalesce into one dead letter — same content, same review action.
 */

import { createHash } from 'node:crypto';

import { dead_letters, flags } from '../db/schema.js';
import { registry, type OpCtx, type OpOutcome, type Tx } from './handlers.js';
import { sanitizeJson, sanitizeText } from './sanitize.js';
import type { UploadEntry } from './types.js';

export interface EntryResult {
  readonly id: string;
  readonly table: string;
  readonly op: string;
  readonly outcome: 'applied' | 'noop' | 'dead-lettered';
  readonly flags: readonly string[];
  readonly reason?: string;
}

/** Deterministic serialization: object keys sorted at every level. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => JSON.stringify(k) + ':' + stableStringify(v));
    return '{' + entries.join(',') + '}';
  }
  return JSON.stringify(value) ?? 'null';
}

async function recordDeadLetter(
  tx: Tx,
  entry: UploadEntry,
  reason: string,
  ctx: OpCtx,
): Promise<EntryResult> {
  const hash = createHash('sha256')
    .update(stableStringify({ entry, deviceId: ctx.deviceId }))
    .digest('hex')
    .slice(0, 32);
  const dlId = `dl-${hash}`;
  await tx
    .insert(dead_letters)
    .values({
      id: dlId,
      op: entry.op,
      record_table: sanitizeText(entry.type),
      record_id: sanitizeText(entry.id),
      payload: sanitizeJson(entry) as Record<string, unknown>,
      reason: sanitizeText(reason),
      actor: ctx.actor,
      device_id: ctx.deviceId,
    })
    .onConflictDoNothing();
  // Fixed copy only — raw reasons (driver errors can embed values and
  // schema internals) stay in the server-only dead_letters table, never on
  // the synced, user-visible flag surface.
  await tx
    .insert(flags)
    .values({
      id: `dl:${hash}`,
      record_table: sanitizeText(entry.type),
      record_id: sanitizeText(entry.id),
      kind: 'dead-lettered-op',
      message: `A ${entry.op} on ${sanitizeText(entry.type)} could not be applied. It is preserved for review - nothing was lost.`,
      actor: ctx.actor,
      device_id: ctx.deviceId,
    })
    .onConflictDoNothing();
  return {
    id: entry.id,
    table: entry.type,
    op: entry.op,
    outcome: 'dead-lettered',
    flags: ['dead-lettered-op'],
    reason,
  };
}

const errorMessage = (e: unknown): string =>
  e instanceof Error ? `${e.name}: ${e.message}` : String(e);

export async function applyUploadBatch(
  db: { transaction: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T> },
  batch: readonly UploadEntry[],
  ctx: OpCtx,
): Promise<EntryResult[]> {
  return db.transaction(async (tx: Tx) => {
    const results: EntryResult[] = [];
    for (const entry of batch) {
      const handler = registry.get(`${entry.type}:${entry.op}`);
      if (handler === undefined) {
        results.push(
          await recordDeadLetter(tx, entry, `no handler for ${entry.op} on ${entry.type}`, ctx),
        );
        continue;
      }
      let outcome: OpOutcome;
      try {
        // Nested transaction = SAVEPOINT: a throwing handler rolls back its
        // own writes only; the batch transaction stays usable.
        outcome = await tx.transaction((sp: Tx) => handler(sp, entry, ctx));
      } catch (e) {
        results.push(await recordDeadLetter(tx, entry, `handler error: ${errorMessage(e)}`, ctx));
        continue;
      }
      if (outcome.outcome === 'dead-letter') {
        results.push(await recordDeadLetter(tx, entry, outcome.reason, ctx));
      } else if (outcome.outcome === 'noop') {
        results.push({ id: entry.id, table: entry.type, op: entry.op, outcome: 'noop', flags: [] });
      } else {
        results.push({
          id: entry.id,
          table: entry.type,
          op: entry.op,
          outcome: 'applied',
          flags: outcome.flagKinds,
        });
      }
    }
    return results;
  });
}
