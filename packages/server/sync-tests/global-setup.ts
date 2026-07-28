/**
 * Brings up the real stack for the torture tier, in the order a fresh
 * deployment needs (see infra/README.md): Postgres → migrations →
 * PowerSync → this server on :4000 (PowerSync fetches its JWKS from here
 * via host.docker.internal).
 *
 * Runs under its OWN compose project (koi-synctest) with its own volume, so
 * it can never touch a dev stack's data. The host ports are shared, so a
 * running dev stack makes `up` fail loudly — stop it first. If setup fails
 * partway, the stack is torn down before rethrowing (no leaked containers).
 *
 * Set KOI_SYNC_KEEP_STACK=1 to leave the Docker stack running afterwards
 * (debugging); by default everything is torn down including volumes so
 * every run starts from a clean replication state.
 */

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { createAuth } from '../src/auth/instance.js';
import {
  createDb,
  createPool,
  ensureDefaultHousehold,
  ensureDefaultOwnerUser,
  migrateDb,
} from '../src/db/client.js';
import { loadEnv } from '../src/env.js';

const composeFile = fileURLToPath(new URL('../../../infra/docker-compose.yml', import.meta.url));

function compose(args: string): void {
  execSync(`docker compose -p koi-synctest -f "${composeFile}" ${args}`, { stdio: 'inherit' });
}

function composeDown(): void {
  if (process.env['KOI_SYNC_KEEP_STACK'] !== '1') compose('down -v');
}

async function waitForTcp(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      await fetch(url);
      return; // any HTTP response means the service is up
    } catch {
      if (Date.now() > deadline) throw new Error(`timed out waiting for ${url}`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

export default async function setup(): Promise<() => Promise<void>> {
  let app: FastifyInstance | null = null;
  let pool: ReturnType<typeof createPool> | null = null;
  try {
    compose('up -d --wait postgres');

    const env = loadEnv();
    pool = createPool(env);
    const db = createDb(pool);
    await migrateDb(pool, db);
    await ensureDefaultHousehold(db);
    await ensureDefaultOwnerUser(db);

    compose('up -d powersync');

    app = buildApp({ env, db, auth: createAuth(env, db, { testBootstrap: true }) });
    await app.listen({ port: env.PORT, host: env.HOST });

    await waitForTcp('http://localhost:8080/probes/liveness', 120_000);
  } catch (e) {
    await app?.close();
    await pool?.end();
    composeDown();
    throw e;
  }

  return async () => {
    await app?.close();
    await pool?.end();
    composeDown();
  };
}
