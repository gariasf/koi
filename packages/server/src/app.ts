/**
 * The write-path API (D-022): Fastify 5 + zod. Routes:
 *
 *   GET  /healthz          liveness
 *   GET  /api/auth/jwks    JWKS for PowerSync token validation
 *   POST /api/auth/token   dev token mint (better-auth replaces this)
 *   POST /upload           PowerSync backend-connector upload target
 *
 * Logging discipline (delta §4): outcomes and counts only — user content
 * never reaches the logs.
 */

import Fastify, { type FastifyInstance } from 'fastify';

import type { AuthShim } from './auth.js';
import type { Db } from './db/client.js';
import type { Env } from './env.js';
import { applyUploadBatch } from './sync/upload.js';
import { tokenBodySchema, uploadBodySchema } from './sync/types.js';

export interface AppDeps {
  readonly env: Env;
  readonly db: Db;
  readonly auth: AuthShim;
}

export function buildApp({ env, db, auth }: AppDeps): FastifyInstance {
  // Default request logging carries method/url/status only — request BODIES
  // (user records) never reach the logs, and handlers below log counts, not
  // content.
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
    // Fastify's 1 MiB default would 413 a large client transaction (e.g. a
    // JSON-export import) BEFORE the handler runs — nothing dead-lettered,
    // and the connector would retry the same oversized batch forever. Large
    // imports should still chunk client-side (PowerSync getCrudBatch).
    bodyLimit: 20 * 1024 * 1024,
  });

  app.get('/healthz', () => ({ ok: true }));

  app.get('/api/auth/jwks', () => auth.jwks);

  if (env.KOI_DEV_AUTH === '1') {
    // Credential-less mint: dev/test only, behind an explicit opt-in.
    // better-auth (passkey-primary) replaces this whole route.
    app.post('/api/auth/token', async (req) => {
      const { username } = tokenBodySchema.parse(req.body ?? {});
      return { token: await auth.mintToken(username), endpoint: env.POWERSYNC_URL };
    });
  }

  app.post('/upload', async (req, reply) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') === true ? header.slice(7) : null;
    if (token === null) return reply.code(401).send({ error: 'missing bearer token' });
    let actor: string;
    try {
      actor = await auth.verifyToken(token);
    } catch {
      return reply.code(401).send({ error: 'invalid token' });
    }

    const parsed = uploadBodySchema.safeParse(req.body);
    if (!parsed.success) {
      // Malformed PROTOCOL (not content) = broken client build. 400 keeps
      // the client retrying visibly; content problems never land here —
      // they are dead-lettered inside applyUploadBatch under a 200.
      return reply.code(400).send({ error: 'malformed upload body' });
    }

    const { deviceId, batch } = parsed.data;
    const results = await applyUploadBatch(db, batch, { actor, deviceId });
    const counts = { applied: 0, noop: 0, 'dead-lettered': 0 };
    for (const r of results) counts[r.outcome] += 1;
    req.log.info({ deviceId, ops: batch.length, ...counts }, 'upload batch');
    return reply.code(200).send({ ok: true, results });
  });

  return app;
}
