/**
 * Recovery-code sign-in (D-025 "passkey-primary + recovery codes"): a
 * standalone break-glass credential for when every passkey is unreachable
 * (device lost or wiped) — NOT a second factor stacked on top of passkey
 * sign-in.
 *
 * better-auth ships backup codes only inside its `two-factor` plugin, which
 * bundles them with genuine 2FA semantics: enabling it flips
 * `user.twoFactorEnabled`, and a hook then challenges EVERY subsequent
 * sign-in via a pending-cookie handshake (the plugin's own
 * `verify-two-factor.ts` reads a signed cookie set by a prior first-factor
 * attempt; there is no supported path to verify a backup code from nothing).
 * That is the wrong shape here — passkey sign-in must stay one tap, not gain
 * a mandatory second step every time. So this plugin does NOT install
 * `two-factor` at all — and, it turns out, could not have reused its backup
 * -code helpers even if that were desirable: `generateBackupCodes` /
 * `verifyBackupCode` / `encodeBackupCodes` are exported as TYPES ONLY from
 * `better-auth/plugins/two-factor` (confirmed the hard way — a
 * `SyntaxError: does not provide an export named 'encodeBackupCodes'` at
 * server boot; they are real runtime functions one module level deeper, but
 * nothing exposes that path publicly). So this plugin is self-contained
 * instead, built directly on the same PUBLIC primitives the two-factor
 * plugin itself uses internally (`better-auth/crypto`'s
 * `generateRandomString` + `symmetricEncrypt`/`symmetricDecrypt`, keyed on
 * the instance secret exactly as `enableTwoFactor` keys its own backup
 * codes) — a small, contained amount of logic, not a reimplementation of
 * anything better-auth doesn't already do the same way. Two endpoints, never
 * touching `user.twoFactorEnabled`, never requiring a pending-2FA cookie:
 * generating codes needs only an ordinary authenticated session (an
 * account-management action, same shape as adding a second passkey), and
 * redeeming one needs nothing but the code itself — exactly as a passkey
 * attempt needs nothing but the passkey. See decisions.md (Session 6) for
 * the full reasoning.
 */

import { APIError, createAuthEndpoint, sessionMiddleware } from 'better-auth/api';
import { generateRandomString, symmetricDecrypt, symmetricEncrypt } from 'better-auth/crypto';
import { setSessionCookie } from 'better-auth/cookies';
import { z } from 'zod';

import { DEFAULT_OWNER_USER_ID } from '../db/client.js';

import type { SecretConfig } from 'better-auth/crypto';

const RECOVERY_CODE_MODEL = 'recoveryCode';

/**
 * Not the defaults elsewhere in the codebase for no reason other than
 * pinning them explicitly — this shape is baked into every stored blob, so
 * changing it later is a rotation, not a config tweak.
 */
const CODE_COUNT = 10;
const CODE_LENGTH = 10;

interface RecoveryCodeRow {
  readonly id: string;
  readonly userId: string;
  readonly encryptedCodes: string;
}

const schema = {
  recoveryCode: {
    fields: {
      userId: {
        type: 'string',
        required: true,
        references: { model: 'user', field: 'id' },
        index: true,
      },
      encryptedCodes: { type: 'string', required: true },
      createdAt: { type: 'date', required: false },
      updatedAt: { type: 'date', required: false },
    },
  },
} as const;

function generateCodes(): string[] {
  return Array.from({ length: CODE_COUNT }, () =>
    generateRandomString(CODE_LENGTH, 'A-Z', '0-9'),
  );
}

async function encryptCodes(codes: readonly string[], key: string | SecretConfig): Promise<string> {
  return symmetricEncrypt({ key, data: JSON.stringify(codes) });
}

async function decryptCodes(blob: string, key: string | SecretConfig): Promise<string[]> {
  return JSON.parse(await symmetricDecrypt({ key, data: blob })) as string[];
}

export const recoveryCode = () => ({
  id: 'recovery-code' as const,
  schema,
  endpoints: {
    /**
     * POST /api/auth/recovery/generate — session-required. Rotates (deletes
     * old, mints new) rather than refusing on a repeat call, mirroring
     * better-auth's own `generate-backup-codes` semantics: a user who lost
     * their saved codes can always ask for a fresh set.
     */
    generateRecoveryCodes: createAuthEndpoint(
      '/recovery/generate',
      { method: 'POST', use: [sessionMiddleware] },
      async (ctx) => {
        const userId = ctx.context.session.user.id;
        const codes = generateCodes();
        const encryptedCodes = await encryptCodes(codes, ctx.context.secretConfig);

        const existing = await ctx.context.adapter.findOne<RecoveryCodeRow>({
          model: RECOVERY_CODE_MODEL,
          where: [{ field: 'userId', value: userId }],
        });
        if (existing) {
          await ctx.context.adapter.update({
            model: RECOVERY_CODE_MODEL,
            where: [{ field: 'id', value: existing.id }],
            update: { encryptedCodes, updatedAt: new Date() },
          });
        } else {
          await ctx.context.adapter.create({
            model: RECOVERY_CODE_MODEL,
            data: { userId, encryptedCodes, createdAt: new Date(), updatedAt: new Date() },
          });
        }
        // Shown to the user exactly once — only the encrypted blob persists.
        return ctx.json({ backupCodes: codes });
      },
    ),

    /**
     * POST /api/auth/recovery/verify — no session. Single-owner today (the
     * lookup is by the fixed bootstrap id, not an ambient "whichever row
     * exists" scan): an S-14 sharing flow would widen this to identify the
     * claimant some other way before it could serve more than one account.
     */
    verifyRecoveryCode: createAuthEndpoint(
      '/recovery/verify',
      { method: 'POST', body: z.object({ code: z.string().min(1) }) },
      async (ctx) => {
        const row = await ctx.context.adapter.findOne<RecoveryCodeRow>({
          model: RECOVERY_CODE_MODEL,
          where: [{ field: 'userId', value: DEFAULT_OWNER_USER_ID }],
        });
        if (!row) {
          throw new APIError('UNAUTHORIZED', { message: 'no recovery codes on file' });
        }

        const codes = await decryptCodes(row.encryptedCodes, ctx.context.secretConfig);
        const submitted = ctx.body.code.trim().toUpperCase();
        const matchIndex = codes.indexOf(submitted);
        if (matchIndex === -1) {
          throw new APIError('UNAUTHORIZED', { message: 'invalid recovery code' });
        }

        // Single-use: persist the remaining codes, re-encrypted.
        codes.splice(matchIndex, 1);
        await ctx.context.adapter.update({
          model: RECOVERY_CODE_MODEL,
          where: [{ field: 'id', value: row.id }],
          update: {
            encryptedCodes: await encryptCodes(codes, ctx.context.secretConfig),
            updatedAt: new Date(),
          },
        });

        const user = await ctx.context.internalAdapter.findUserById(row.userId);
        if (!user) {
          throw new APIError('UNAUTHORIZED', { message: 'account not found' });
        }
        const session = await ctx.context.internalAdapter.createSession(user.id);
        if (!session) {
          throw new APIError('INTERNAL_SERVER_ERROR', { message: 'failed to create session' });
        }
        await setSessionCookie(ctx, { session, user });
        // Same shape as passkey/anonymous sign-in: a client that already
        // knows how to read `{token}` off a sign-in response needs no
        // special case for recovery.
        return ctx.json({ token: session.token });
      },
    ),
  },
});
