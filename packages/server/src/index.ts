export { buildApp, type AppDeps } from './app.js';
export { createAuth, type Auth } from './auth/instance.js';
export {
  createDb,
  createPool,
  ensureDefaultHousehold,
  ensureDefaultOwnerUser,
  migrateDb,
  DEFAULT_HOUSEHOLD_ID,
  DEFAULT_OWNER_USER_ID,
  DEFAULT_OWNER_EMAIL,
  type Db,
} from './db/client.js';
export { loadEnv, type Env } from './env.js';
export * as schema from './db/schema.js';
export * as authSchema from './db/auth-schema.js';
