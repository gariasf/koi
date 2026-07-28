/**
 * Entry point for `better-auth generate` ONLY (package.json `db:generate`).
 * The CLI needs to statically import a ready-made `auth` instance; the real
 * server (`main.ts`) builds one from env/db loaded at boot instead, via the
 * `createAuth` factory this file just wraps. Never imported at runtime.
 */

import { createDb, createPool } from '../db/client.js';
import { loadEnv } from '../env.js';
import { createAuth } from './instance.js';

export const auth = createAuth(loadEnv(), createDb(createPool(loadEnv())));
