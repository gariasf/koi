import { fileURLToPath } from 'node:url';

import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

import type { Env } from '../env.js';
import * as schema from './schema.js';

export type Db = NodePgDatabase<typeof schema>;

export function createPool(env: Env): pg.Pool {
  return new pg.Pool({ connectionString: env.DATABASE_URL });
}

export function createDb(pool: pg.Pool): Db {
  return drizzle(pool, { schema });
}

/**
 * Applies committed SQL migrations (drizzle/). Idempotent; runs at boot.
 * Serialized by a session advisory lock held on a dedicated connection, so
 * overlapping boots (restart races, a dev server next to db:migrate) never
 * run DDL concurrently.
 */
export async function migrateDb(pool: pg.Pool, db: Db): Promise<void> {
  // src/db/ and dist/db/ sit at the same depth relative to the package root.
  const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));
  const client = await pool.connect();
  try {
    await client.query(`SELECT pg_advisory_lock(hashtext('koi-migrate'))`);
    await migrate(db, { migrationsFolder });
  } finally {
    await client.query(`SELECT pg_advisory_unlock(hashtext('koi-migrate'))`).catch(() => undefined);
    client.release();
  }
}

/**
 * Single-tenant bootstrap: the one household this server serves, at a
 * well-known id (D-023 settings-singleton pattern). Sharing later means
 * adding households/members, not changing this.
 */
export const DEFAULT_HOUSEHOLD_ID = 'household-default';

export async function ensureDefaultHousehold(db: Db): Promise<void> {
  await db.insert(schema.households).values({ id: DEFAULT_HOUSEHOLD_ID }).onConflictDoNothing();
}
