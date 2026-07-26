/**
 * The real stack for the app-against-server tier — the same bring-up order the
 * server's own torture tier uses (infra/README.md): Postgres → migrations →
 * PowerSync → @koi/server on :4000.
 *
 * It drives @koi/server through its public exports rather than duplicating its
 * boot code, and runs under its OWN compose project (koi-mobiletest) with its own
 * volume, so it can never touch a dev stack's data. Host ports are shared, so a
 * running dev stack (or the server's tier running concurrently) makes `up` fail
 * loudly — `turbo run test:sync --concurrency=1` keeps them serial in CI.
 */

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildApp,
  createAuthShim,
  createDb,
  createPool,
  ensureDefaultHousehold,
  loadEnv,
  migrateDb,
} from '@koi/server';

/** Fastify is @koi/server's dependency, not this package's — hence the structural type. */
type RunningApp = ReturnType<typeof buildApp>;

// path.join rather than `new URL(...)`: this package's tsconfig carries the DOM
// lib (it is an app), and DOM's URL is not Node's URL as far as tsc is concerned.
const composeFile = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../infra/docker-compose.yml',
);

function compose(args: string): void {
  execSync(`docker compose -p koi-mobiletest -f "${composeFile}" ${args}`, { stdio: 'inherit' });
}

function composeDown(): void {
  if (process.env['KOI_SYNC_KEEP_STACK'] !== '1') compose('down -v');
}

async function waitForHttp(url: string, timeoutMs: number): Promise<void> {
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
  let app: RunningApp | null = null;
  let pool: ReturnType<typeof createPool> | null = null;
  try {
    compose('up -d --wait postgres');

    const env = loadEnv({ KOI_DEV_AUTH: '1' });
    pool = createPool(env);
    const db = createDb(pool);
    await migrateDb(pool, db);
    await ensureDefaultHousehold(db);

    compose('up -d powersync');

    app = buildApp({ env, db, auth: await createAuthShim(env) });
    await app.listen({ port: env.PORT, host: env.HOST });

    await waitForHttp('http://localhost:8080/probes/liveness', 120_000);
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
