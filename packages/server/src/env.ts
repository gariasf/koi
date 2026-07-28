import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5433/koi'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().default(4000),
  /** Sync endpoint handed to clients once they hold a valid session/token. */
  POWERSYNC_URL: z.string().default('http://localhost:8080'),
  JWT_AUDIENCE: z.string().default('koi-powersync-dev'),
  JWT_ISSUER: z.string().default('koi-server-dev'),
  LOG_LEVEL: z.string().default('info'),
  /**
   * better-auth's own instance secret (session/cookie signing, JWK private-key
   * encryption, backup-code encryption). The dev default is fixed and PUBLIC —
   * every clone of this repo shares it — which is fine only because the dev
   * stack binds to loopback and ships no production data. A real deployment
   * MUST override this with a random 32+ byte value kept out of version
   * control (D-025: this is the one secret the whole auth stack roots in).
   */
  BETTER_AUTH_SECRET: z
    .string()
    .min(16)
    .default('koi-dev-only-insecure-better-auth-secret-do-not-deploy'),
  /** Where better-auth itself is mounted; passkey's `origin` defaults from this. */
  BETTER_AUTH_URL: z.string().default('http://localhost:4000'),
  /**
   * WebAuthn relying-party id: the domain a passkey is scoped to. 'localhost'
   * is the one non-domain value browsers accept for local dev. A native-app
   * ceremony (Associated Domains) needs a real resolvable domain instead —
   * see decisions.md on Session 6's passkey-on-Expo finding.
   */
  AUTH_RP_ID: z.string().default('localhost'),
  AUTH_RP_NAME: z.string().default('Koi'),
  /**
   * Comma-separated list of additional origins allowed to complete a WebAuthn
   * ceremony (e.g. the Expo dev client's own origin) and to be trusted as a
   * better-auth cookie/CORS origin. BETTER_AUTH_URL is always included.
   */
  AUTH_EXTRA_ORIGINS: z.string().default(''),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(overrides: Partial<Record<keyof Env, string>> = {}): Env {
  return envSchema.parse({ ...process.env, ...overrides });
}
