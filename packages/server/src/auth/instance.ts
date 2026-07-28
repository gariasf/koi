/**
 * better-auth, mounted in-process (D-025). Replaces the dev jose/JWKS shim
 * (`auth.ts`, deleted this session — D-038: "the dev token mint... dies with
 * better-auth") with the real thing: passkey-primary, recovery codes as a
 * standalone fallback (`recovery.ts`), no password, no email dependency.
 *
 * PowerSync's contract is unchanged by the swap (the dev shim's own header
 * comment predicted this): `aud`/`iss` still come from env.ts's
 * JWT_AUDIENCE/JWT_ISSUER, `exp` stays <=24h, and `GET /api/auth/jwks` is
 * still the endpoint PowerSync's `jwks_uri` points at — better-auth's JWT
 * plugin serves it at that exact default path, so `infra/powersync/config.yaml`
 * needed no change.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt } from 'better-auth/plugins/jwt';
import { expo } from '@better-auth/expo';
import { passkey } from '@better-auth/passkey';

import { APIError } from 'better-auth/api';

import { DEFAULT_OWNER_USER_ID } from '../db/client.js';
import * as authSchema from '../db/auth-schema.js';
import { recoveryCode } from './recovery.js';
import { testBootstrapAuth } from './test-bootstrap.js';

import type { Db } from '../db/client.js';
import type { Env } from '../env.js';

export type Auth = ReturnType<typeof createAuth>;

export interface CreateAuthOptions {
  /**
   * Mounts `POST /api/auth/test/bootstrap-session` (test-bootstrap.ts), a
   * credential-less session mint for the sync-torture harnesses' headless
   * "devices". `main.ts` never passes this; only `sync-tests/global-setup.ts`
   * (server) and `packages/mobile/sync-tests/global-setup.ts` do. The
   * NODE_ENV guard below is defense in depth, not the only guard — see the
   * module doc on `test-bootstrap.ts` for why this can't regress into
   * D-038's hole the way an env-var switch (`KOI_DEV_AUTH`) could.
   */
  readonly testBootstrap?: boolean;
}

/**
 * The origin(s) a passkey ceremony is allowed to complete from. `localhost`
 * is the one non-domain rpID browsers special-case for local dev — anything
 * else (a native-app Associated Domains ceremony, or a real deployment)
 * needs a real resolvable https:// origin, independent of where the API
 * itself happens to listen (`BETTER_AUTH_URL`). See decisions.md (Session 6)
 * for what this repo actually tested on the iOS simulator.
 */
function passkeyOrigins(env: Env): string[] {
  const extra = env.AUTH_EXTRA_ORIGINS.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  const primary = env.AUTH_RP_ID === 'localhost' ? env.BETTER_AUTH_URL : `https://${env.AUTH_RP_ID}`;
  return [primary, ...extra];
}

// No explicit return-type annotation: betterAuth() is generic over its exact
// options shape, and widening the return type to Auth<BetterAuthOptions> (what
// `ReturnType<typeof betterAuth>` resolves to) loses the specific plugin
// endpoints (auth.api.verifyJWT, .getToken, …) that callers need typed.
export function createAuth(env: Env, db: Db, options: CreateAuthOptions = {}) {
  if (options.testBootstrap === true && process.env['NODE_ENV'] === 'production') {
    throw new Error('createAuth: testBootstrap must never be enabled under NODE_ENV=production');
  }

  const trustedOrigins = [
    env.BETTER_AUTH_URL,
    ...passkeyOrigins(env),
    // @koi/mobile's own scheme (app.json). Native requests carry no browser
    // Origin header; @better-auth/expo's client plugin stamps this instead,
    // and better-auth's origin check needs it on the allow-list to agree.
    'koi://',
  ];

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [...new Set(trustedOrigins)],
    database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
    // No email/password anywhere in the flow (D-025: "no email dependency,
    // EUR 0") — the `user.email` column still exists (better-auth requires
    // it) but is never used to contact anyone; see DEFAULT_OWNER_EMAIL.
    emailAndPassword: { enabled: false },
    plugins: [
      // REQUIRED for the native client, not optional polish: a React Native
      // request carries NO `Origin` header at all, and better-auth rejects
      // every state-changing POST without one (403 MISSING_OR_NULL_ORIGIN —
      // which is exactly how the passkey ceremony failed before this was
      // added: `verify-registration` 403'd while the GET option-fetches
      // sailed through). `@better-auth/expo`'s CLIENT plugin stamps the app
      // scheme into a custom `expo-origin` header instead, and this SERVER
      // half is the only thing that reads it back and rewrites the request's
      // real origin. Client and server halves are a pair; installing one
      // without the other looks fine until the first POST.
      expo(),
      jwt({
        jwt: {
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE,
          expirationTime: '24h',
        },
      }),
      passkey({
        rpID: env.AUTH_RP_ID,
        rpName: env.AUTH_RP_NAME,
        origin: passkeyOrigins(env),
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'preferred',
        },
        registration: {
          // Passwordless bootstrap (D-025): the very first passkey this
          // server ever sees attaches to the single pre-seeded owner
          // account (`ensureDefaultOwnerUser`) with no prior session. Every
          // later registration — a second device, a replacement after a
          // lost phone — must go through the DEFAULT authenticated path
          // (requireSession stays true at the type level; this callback
          // only ever fires for the sessionless case) by first signing in
          // on a device that already holds a passkey. Without the guard
          // below, resolveUser would hand the owner account to whoever
          // reached this endpoint first, indefinitely — not just once.
          requireSession: false,
          resolveUser: async ({ ctx }) => {
            const alreadyRegistered = await ctx.context.adapter.findOne({
              model: 'passkey',
              where: [{ field: 'userId', value: DEFAULT_OWNER_USER_ID }],
            });
            if (alreadyRegistered) {
              throw new APIError('FORBIDDEN', {
                message: 'Owner already has a passkey — sign in on an existing device to add another.',
              });
            }
            return { id: DEFAULT_OWNER_USER_ID, name: 'Owner' };
          },
        },
      }),
      recoveryCode(),
      ...(options.testBootstrap === true ? [testBootstrapAuth()] : []),
    ],
  });
}
