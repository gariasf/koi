/**
 * The device's PowerSync database and its connection.
 *
 * This is the ONLY module that imports the React Native SDK, which keeps every
 * other module — schema, connector, and the whole data layer — runnable under
 * Node against `@powersync/node`. That is what makes the CI integration tier a
 * proof about the app's own code rather than about a re-implementation of it.
 *
 * `database: { dbFilename }` is all the configuration op-sqlite needs in SDK 2.x
 * (it is the default open factory now). `iosSqlite` must never be switched on:
 * Apple's system SQLite has extension loading disabled, and PowerSync loads its
 * core as an extension.
 */

import { PowerSyncDatabase } from '@powersync/react-native';

import { koiSchema } from './schema';

import type { KoiConnectorOptions } from './connector';
import type { CommonPowerSyncDatabase } from '@powersync/common';

export const DB_FILENAME = 'koi.db';

export function createKoiDatabase(): CommonPowerSyncDatabase {
  return new PowerSyncDatabase({ schema: koiSchema, database: { dbFilename: DB_FILENAME } });
}

/**
 * Sync options moved from the constructor to `connect()` in PowerSync 2.x; the
 * defaults are what we want, so this stays a one-liner whose job is to be the
 * single place a connection option would ever be added.
 */
export async function connectKoi(
  db: CommonPowerSyncDatabase,
  connector: { fetchCredentials: unknown; uploadData: unknown },
): Promise<void> {
  await db.connect(connector as Parameters<CommonPowerSyncDatabase['connect']>[0]);
}

export type { KoiConnectorOptions };
