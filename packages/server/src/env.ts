import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5433/koi'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().default(4000),
  /** Sync endpoint handed to clients by the dev token route. */
  POWERSYNC_URL: z.string().default('http://localhost:8080'),
  JWT_AUDIENCE: z.string().default('koi-powersync-dev'),
  JWT_ISSUER: z.string().default('koi-server-dev'),
  LOG_LEVEL: z.string().default('info'),
  /**
   * Explicit opt-in for the credential-less dev token mint. OFF by default:
   * a server that reaches a network without better-auth must not silently
   * hand out full read+write tokens.
   */
  KOI_DEV_AUTH: z.enum(['0', '1']).default('0'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(overrides: Partial<Record<keyof Env, string>> = {}): Env {
  return envSchema.parse({ ...process.env, ...overrides });
}
