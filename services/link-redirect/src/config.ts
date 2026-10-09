/** Typed configuration from environment variables (see .env.example). */
import { affiliateEnvFrom, type AffiliateEnv } from '@akaya/affiliate';
import { z } from 'zod';

const Env = z.object({
  PORT: z.coerce.number().default(8790),
  /** public origin of short links (placeholder domain until DNS is set up) */
  PUBLIC_BASE_URL: z.string().url().default('https://go.akaya.one'),
  /** Bearer token for POST /links, imports and reports. Required. */
  ADMIN_TOKEN: z.string().min(16, 'ADMIN_TOKEN must be at least 16 characters'),
  /** secret used to hash anonymous user ids before they are stored */
  ANON_SALT: z.string().min(16, 'ANON_SALT must be at least 16 characters'),
  /** JSON store file ("" = in memory). Production: Postgres (see README). */
  DATA_FILE: z.string().default('data/links.json'),
});

export type Config = z.infer<typeof Env> & { affiliate: AffiliateEnv; raw: NodeJS.ProcessEnv };

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => ({
  ...Env.parse(env),
  affiliate: affiliateEnvFrom(env),
  raw: env,
});
