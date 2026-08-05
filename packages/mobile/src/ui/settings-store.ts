/**
 * Device-local preferences, in `app_meta` beside the sync flag (`sync/mode.ts`).
 *
 * `app_meta` is `localOnly` (never synced, D-025): which appearance THIS device
 * prefers is not itself something to sync — a phone in a pocket and a phone on a
 * desk can honestly disagree.
 */

import type { KoiDb } from '../data/db';

export type Appearance = 'system' | 'light' | 'dark';

const APPEARANCE_KEY = 'appearance';

const isAppearance = (v: string | null | undefined): v is Appearance =>
  v === 'system' || v === 'light' || v === 'dark';

export async function readAppearance(db: KoiDb): Promise<Appearance> {
  const rows = await db.getAll<{ value: string | null }>(
    `SELECT value FROM app_meta WHERE id = ?`,
    [APPEARANCE_KEY],
  );
  const value = rows[0]?.value;
  return isAppearance(value) ? value : 'system';
}

export async function writeAppearance(db: KoiDb, appearance: Appearance): Promise<void> {
  await db.execute(`INSERT OR REPLACE INTO app_meta (id, value) VALUES (?, ?)`, [
    APPEARANCE_KEY,
    appearance,
  ]);
}

/**
 * Has this device ever synced? The discriminator the whole Settings sheet runs on
 * (D-058): not "is sync on" — turning sync off is a *pause*. Nothing already sent
 * is clawed back, the founding passkey outlives it, and the account still exists,
 * so a privacy card keyed on the toggle would print a false promise the moment a
 * user paused. Latched once, never cleared.
 */
const HAS_EVER_SYNCED_KEY = 'has_ever_synced';

export async function hasEverSynced(db: KoiDb): Promise<boolean> {
  const rows = await db.getAll<{ value: string | null }>(
    `SELECT value FROM app_meta WHERE id = ?`,
    [HAS_EVER_SYNCED_KEY],
  );
  return rows[0]?.value === '1';
}

export async function latchEverSynced(db: KoiDb): Promise<void> {
  await db.execute(`INSERT OR REPLACE INTO app_meta (id, value) VALUES (?, ?)`, [
    HAS_EVER_SYNCED_KEY,
    '1',
  ]);
}
