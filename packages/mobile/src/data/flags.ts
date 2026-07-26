/**
 * The S-4 review queue's data layer: read the flags, latch them resolved, and —
 * where the architecture can actually deliver it — write a displaced value back.
 *
 * Two hard rules from D-013 / D-047 live here:
 *
 *  - **Nothing is repaired automatically.** Every write in this file is the
 *    direct result of a tap. `resolveFlag` writes only the latch; it never
 *    touches the record the flag is about.
 *  - **A restore is an ordinary edit**, not a special path: it goes out as a
 *    PATCH and is analysed like any other, so restoring a displaced value can
 *    itself raise a flag if a third device changed the column meanwhile. That is
 *    correct — it keeps one protocol, not two.
 */

import { PATCHABLE_COLUMNS } from '../sync/schema';
import { namedPayloadEntries, unwrapPayload } from '../review/kinds';

import type { KoiDb, KoiTx } from './db';

export interface FlagRow {
  readonly id: string;
  readonly household_id: string | null;
  readonly record_table: string;
  readonly record_id: string;
  readonly car_id: string | null;
  readonly column_name: string | null;
  readonly kind: string;
  readonly message: string;
  readonly displaced_value: string | null;
  readonly incoming_value: string | null;
  readonly actor: string | null;
  readonly device_id: string | null;
  readonly record_version: number | null;
  readonly created_at: string | null;
  readonly resolved_at: string | null;
}

export const OPEN_FLAGS_SQL = `SELECT * FROM flags WHERE resolved_at IS NULL ORDER BY created_at DESC, id`;
export const RESOLVED_FLAGS_SQL = `SELECT * FROM flags WHERE resolved_at IS NOT NULL ORDER BY resolved_at DESC, id`;
export const OPEN_FLAG_COUNT_SQL = `SELECT count(*) AS n FROM flags WHERE resolved_at IS NULL`;

export const flagById = async (db: KoiDb, id: string): Promise<FlagRow | null> =>
  (await db.getAll<FlagRow>(`SELECT * FROM flags WHERE id = ?`, [id]))[0] ?? null;

/**
 * The latch (D-047). The value written here is intent, not data: the server
 * stamps its own clock and syncs it back down. Re-opening passes null — that is
 * how the undo toast reverses a mis-tap.
 */
export async function resolveFlag(db: KoiDb, id: string, at: string): Promise<void> {
  await db.execute(`UPDATE flags SET resolved_at = ? WHERE id = ?`, [at, id]);
}

export async function reopenFlag(db: KoiDb, id: string): Promise<void> {
  await db.execute(`UPDATE flags SET resolved_at = NULL WHERE id = ?`, [id]);
}

/**
 * The displaced value(s) a restore would write, as `column → value`.
 *
 * Columns the server will not accept on a PATCH are dropped here rather than
 * sent — `household_id` and `car_id` appear in a server-side snapshot but are
 * not re-homable, and a PATCH carrying either dead-letters loudly (D-038).
 * Returns null when there is nothing restorable, which is how the screen decides
 * not to offer the action at all.
 */
export function restorableColumns(flag: FlagRow): Record<string, unknown> | null {
  const patchable = PATCHABLE_COLUMNS.get(flag.record_table);
  if (patchable === undefined) return null;

  const entries = namedPayloadEntries(
    flag.kind,
    flag.column_name,
    unwrapPayload(flag.displaced_value),
  );
  const restorable = Object.fromEntries(
    entries.filter((e) => patchable.includes(e.column)).map((e) => [e.column, e.value]),
  );
  return Object.keys(restorable).length > 0 ? restorable : null;
}

/**
 * Writes the displaced values back as one ordinary edit. Confirms the row is
 * still on the device first, inside the same write: under bucket-filter a
 * deleted row simply is not there, and an UPDATE that matches nothing must not
 * be reported as done — the caller latches the flag resolved right after this
 * returns true, and a false "done" would close the review on nothing.
 */
export async function restoreDisplaced(db: KoiDb, flag: FlagRow): Promise<boolean> {
  const values = restorableColumns(flag);
  if (values === null) return false;
  const columns = Object.keys(values);
  const sets = columns.map((c) => `${c} = ?`).join(', ');

  return db.writeTransaction(async (tx: KoiTx) => {
    const present = await tx.getAll<{ id: string }>(
      `SELECT id FROM ${flag.record_table} WHERE id = ?`,
      [flag.record_id],
    );
    if (present.length === 0) return false;
    await tx.execute(`UPDATE ${flag.record_table} SET ${sets} WHERE id = ?`, [
      ...columns.map((c) => values[c]),
      flag.record_id,
    ]);
    return true;
  });
}
