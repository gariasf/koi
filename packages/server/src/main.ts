import { buildApp } from './app.js';
import { createAuthShim } from './auth.js';
import { createDb, createPool, ensureDefaultHousehold, migrateDb } from './db/client.js';
import { loadEnv } from './env.js';

const env = loadEnv();
const pool = createPool(env);
const db = createDb(pool);
await migrateDb(pool, db);
await ensureDefaultHousehold(db);
const app = buildApp({ env, db, auth: await createAuthShim(env) });
await app.listen({ port: env.PORT, host: env.HOST });
