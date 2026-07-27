/**
 * Whether this device syncs at all — the ③ switch (D-006/D-052).
 *
 * Local-only is the default and needs no special code path: `init()` already
 * applies the full synced schema (it always has, even before this file
 * existed), and PowerSync's own triggers queue every write into the local
 * `ps_crud` table regardless of whether anything is connected. Local-only mode
 * is simply **never calling `connect()`** — the app is fully itself without it,
 * and nothing here makes a network call while it is off.
 *
 * The flag lives in `app_meta` (device-local, never synced, D-025) so it
 * survives restarts but never leaves the device — whether THIS device syncs is
 * not itself something to sync.
 */

import type { KoiDb } from '../data/db';

const SYNC_ENABLED_KEY = 'sync_enabled';

export async function isSyncEnabled(db: KoiDb): Promise<boolean> {
  const rows = await db.getAll<{ value: string | null }>(
    `SELECT value FROM app_meta WHERE id = ?`,
    [SYNC_ENABLED_KEY],
  );
  return rows[0]?.value === '1';
}

export async function setSyncEnabled(db: KoiDb, enabled: boolean): Promise<void> {
  await db.execute(`INSERT OR REPLACE INTO app_meta (id, value) VALUES (?, ?)`, [
    SYNC_ENABLED_KEY,
    enabled ? '1' : '0',
  ]);
}
