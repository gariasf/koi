/**
 * The write-path API (D-022): Fastify 5 + zod. Routes:
 *
 *   GET      /healthz          liveness
 *   ALL      /api/auth/*       better-auth (passkey, recovery codes, session,
 *                              JWT mint + JWKS — D-025, Build Session 6)
 *   POST     /upload           PowerSync backend-connector upload target
 *
 * Logging discipline (delta §4): outcomes and counts only — user content
 * never reaches the logs.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';

import type { Auth } from './auth/instance.js';
import type { Db } from './db/client.js';
import type { Env } from './env.js';
import { applyUploadBatch } from './sync/upload.js';
import { uploadBodySchema } from './sync/types.js';

export interface AppDeps {
  readonly env: Env;
  readonly db: Db;
  readonly auth: Auth;
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

  // better-auth owns everything under /api/auth/* — passkey registration and
  // sign-in, recovery-code generate/verify (auth/recovery.ts), session
  // management, and PowerSync's two contract endpoints (GET /api/auth/jwks,
  // GET /api/auth/token). Its handler speaks the Fetch API's Request/Response,
  // not Fastify's own req/reply, so the route rebuilds one from the raw
  // Node request — the documented Fastify integration pattern. This bypasses
  // Fastify's own outbound plugin lifecycle (no @fastify/cors etc. would fire
  // here), which is moot today: the client is React Native, not a browser, so
  // nothing in this app registers CORS at all.
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    handler: async (req, reply) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      const headers = fromNodeHeaders(req.headers);
      // Always matches what we actually attach below (a JSON-stringified
      // body), regardless of what the original caller declared — a bare
      // `POST` with no content-type (any client that skips a body on a
      // no-input endpoint, e.g. auth/test-bootstrap.ts) would otherwise
      // reconstruct into a request better-auth 415s before it ever reaches
      // the endpoint handler.
      if (hasBody) headers.set('content-type', 'application/json');
      const request = new Request(url.toString(), {
        method: req.method,
        headers,
        ...(hasBody ? { body: JSON.stringify(req.body ?? {}) } : {}),
      });
      const response = await auth.handler(request);
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      // Auth failures log their status and better-auth's own error CODE (never
      // the body: it can echo request content, and delta §4 keeps user content
      // out of the logs). Worth having permanently — every real integration
      // bug this session produced was a bare status code with the actual
      // reason only in the response body (415 content-type, 403
      // MISSING_OR_NULL_ORIGIN), and each one cost a debugging round-trip.
      const text = response.body ? await response.text() : null;
      if (response.status >= 400) {
        let code: string | undefined;
        try {
          code = (JSON.parse(text ?? '{}') as { code?: string }).code;
        } catch {
          code = undefined;
        }
        req.log.warn({ path: url.pathname, status: response.status, code }, 'auth route rejected');
      }
      return reply.send(text);
    },
  });

  app.post('/upload', async (req, reply) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') === true ? header.slice(7) : null;
    if (token === null) return reply.code(401).send({ error: 'missing bearer token' });

    // Verified through better-auth's own JWT plugin (in-process, no extra
    // HTTP hop) rather than re-implemented against its JWKS: this is the same
    // check PowerSync itself performs against the same tokens, so "valid" has
    // exactly one definition across both consumers.
    const verified = await auth.api.verifyJWT({ body: { token } }).catch(() => null);
    const actor = verified?.payload?.sub;
    if (actor === undefined || actor === null || actor === '') {
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
