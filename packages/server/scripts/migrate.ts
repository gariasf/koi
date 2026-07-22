import { createDb, createPool, ensureDefaultHousehold, migrateDb } from '../src/db/client.js';
import { loadEnv } from '../src/env.js';

const env = loadEnv();
const pool = createPool(env);
const db = createDb(pool);

await migrateDb(pool, db);
await ensureDefaultHousehold(db);
await pool.end();
console.log('migrations applied');
