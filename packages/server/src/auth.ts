/**
 * Dev auth shim (Ⓓ-min carried from Spike ②): an in-process EdDSA keypair,
 * JWKS publish, JWT mint/verify via jose — the same mechanics better-auth's
 * JWT plugin uses, so swapping it in later changes the issuer, not the
 * contract. PowerSync validates client tokens against GET /api/auth/jwks.
 *
 * Keys live in memory: restarting the server invalidates outstanding dev
 * tokens (clients just re-fetch). better-auth persists keys in Postgres.
 */

import {
  SignJWT,
  calculateJwkThumbprint,
  exportJWK,
  generateKeyPair,
  jwtVerify,
  type JWK,
} from 'jose';

import type { Env } from './env.js';

export interface AuthShim {
  readonly jwks: { keys: JWK[] };
  mintToken(sub: string): Promise<string>;
  /** Verifies signature, audience and issuer; returns the subject (actor). */
  verifyToken(token: string): Promise<string>;
}

export async function createAuthShim(env: Env): Promise<AuthShim> {
  const { publicKey, privateKey } = await generateKeyPair('EdDSA', {
    crv: 'Ed25519',
    extractable: true,
  });

  const publicJwk = await exportJWK(publicKey);
  publicJwk.alg = 'EdDSA';
  publicJwk.use = 'sig';
  publicJwk.kid = await calculateJwkThumbprint(publicJwk);

  return {
    jwks: { keys: [publicJwk] },

    async mintToken(sub: string): Promise<string> {
      // PowerSync contract: aud = configured audience, exp <= 24h, kid
      // resolvable via jwks_uri.
      return new SignJWT({})
        .setProtectedHeader({ alg: 'EdDSA', kid: publicJwk.kid as string })
        .setSubject(sub)
        .setAudience(env.JWT_AUDIENCE)
        .setIssuer(env.JWT_ISSUER)
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey);
    },

    async verifyToken(token: string): Promise<string> {
      const { payload } = await jwtVerify(token, publicKey, {
        audience: env.JWT_AUDIENCE,
        issuer: env.JWT_ISSUER,
      });
      if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        throw new Error('token has no subject');
      }
      return payload.sub;
    },
  };
}
