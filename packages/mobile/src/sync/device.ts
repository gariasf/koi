/**
 * This device's identity.
 *
 * The server's per-column attribution ledger keys on it (`column_versions[col].by`),
 * and three S-6 rules read it directly: a device's own sequential edits never
 * self-conflict, only the deleting device's re-INSERT resurrects a reading
 * (D-040), and a foreign re-create is preserved-and-flagged instead. So it has to
 * be *stable across launches* — a fresh id every start would make the app a
 * stranger to its own writes.
 *
 * It lives in the local-only `app_meta` table: never synced, never uploaded as a
 * record. It travels only in the upload envelope, where the server needs it.
 */

import { newId } from '../data/ids';

import type { KoiDb } from '../data/db';

const DEVICE_ID_KEY = 'device_id';

export async function getOrCreateDeviceId(db: KoiDb): Promise<string> {
  const rows = await db.getAll<{ value: string | null }>(
    `SELECT value FROM app_meta WHERE id = ?`,
    [DEVICE_ID_KEY],
  );
  const existing = rows[0]?.value;
  if (existing != null && existing !== '') return existing;

  const deviceId = `device-${newId()}`;
  await db.execute(`INSERT OR REPLACE INTO app_meta (id, value) VALUES (?, ?)`, [
    DEVICE_ID_KEY,
    deviceId,
  ]);
  return deviceId;
}
