export { buildApp, type AppDeps } from './app.js';
export { createAuthShim, type AuthShim } from './auth.js';
export {
  createDb,
  createPool,
  ensureDefaultHousehold,
  migrateDb,
  DEFAULT_HOUSEHOLD_ID,
  type Db,
} from './db/client.js';
export { loadEnv, type Env } from './env.js';
export * as schema from './db/schema.js';
