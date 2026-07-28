import { buildApp } from './app.js';
import { createAuth } from './auth/instance.js';
import {
  createDb,
  createPool,
  ensureDefaultHousehold,
  ensureDefaultOwnerUser,
  migrateDb,
} from './db/client.js';
import { loadEnv } from './env.js';

const env = loadEnv();
const pool = createPool(env);
const db = createDb(pool);
await migrateDb(pool, db);
await ensureDefaultHousehold(db);
await ensureDefaultOwnerUser(db);
const app = buildApp({ env, db, auth: createAuth(env, db) });
await app.listen({ port: env.PORT, host: env.HOST });
