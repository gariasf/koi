/**
 * The local upload queue — PowerSync's own `ps_crud` table, populated by every
 * write regardless of connection state (see `mode.ts`). Two things read it:
 * the settings surface's honest "N changes waiting" count, and the sync-tests
 * tier's proof that a backlog drains completely on first connect.
 */

export interface CrudQueueDb {
  getNextCrudTransaction(): Promise<unknown>;
}

export interface UploadQueueStatsDb {
  getUploadQueueStats(): Promise<{ count: number }>;
}

/** How many local writes have not yet reached the server. Zero when disconnected too — this is a local count, not a connection check. */
export async function pendingUploadCount(db: UploadQueueStatsDb): Promise<number> {
  const stats = await db.getUploadQueueStats();
  return stats.count;
}

/**
 * Resolves once every queued write has been accepted by the server (the
 * connector completes a transaction only after a 2xx). Used to prove a backlog
 * drains completely, and to know when "Turn on sync" is actually done rather
 * than merely started.
 */
export function crudQueueSettler(db: CrudQueueDb, timeoutMs = 60_000): () => Promise<void> {
  return async () => {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      if ((await db.getNextCrudTransaction()) == null) return;
      if (Date.now() > deadline) {
        throw new Error('timed out waiting for the upload queue to drain');
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  };
}
