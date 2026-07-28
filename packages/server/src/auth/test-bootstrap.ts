/**
 * Test-only session bootstrap — deliberately NOT part of the production auth
 * surface.
 *
 * All three sync-torture tiers (server 13 scenarios, mobile 9, local-first 3)
 * need a real bearer token to exercise `/upload`, but their "devices" are
 * headless `@powersync/node` clients: no WebAuthn authenticator exists to
 * complete a real passkey ceremony, and a fresh stack's first boot has no
 * saved recovery codes either (`recovery/verify` needs codes that only exist
 * after a passkey has registered once). This plugin closes that gap the same
 * way `KOI_DEV_AUTH` used to — a credential-less session mint — but shaped so
 * it cannot regress into D-038's exact hole ("a server that reaches a network
 * without better-auth must not silently hand out tokens"): there is no env
 * var to leave on by accident. It exists at all only when a caller passes
 * `testBootstrap: true` to `createAuth` — a source-code decision at the call
 * site, not a runtime one — `main.ts` never does, and `createAuth` itself
 * refuses to honour the flag under `NODE_ENV=production` (see instance.ts).
 *
 * It mints a session for the pre-seeded owner row (`ensureDefaultOwnerUser`)
 * directly — no user creation here, so a test stack that forgot to seed it
 * fails loudly instead of quietly minting a session for nothing.
 */

import { APIError, createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';

import { DEFAULT_OWNER_USER_ID } from '../db/client.js';

export const testBootstrapAuth = () => ({
  id: 'test-bootstrap' as const,
  endpoints: {
    bootstrapTestSession: createAuthEndpoint('/test/bootstrap-session', { method: 'POST' }, async (ctx) => {
      const user = await ctx.context.internalAdapter.findUserById(DEFAULT_OWNER_USER_ID);
      if (!user) {
        throw new APIError('INTERNAL_SERVER_ERROR', {
          message: 'default owner user not seeded — call ensureDefaultOwnerUser before the test stack starts',
        });
      }
      const session = await ctx.context.internalAdapter.createSession(user.id);
      if (!session) {
        throw new APIError('INTERNAL_SERVER_ERROR', { message: 'failed to create session' });
      }
      await setSessionCookie(ctx, { session, user });
      return ctx.json({ token: session.token });
    }),
  },
});
