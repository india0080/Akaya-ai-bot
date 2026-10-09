/**
 * Typed configuration from environment variables (.env). Every key is optional: with no keys the
 * agent runs on the Mock provider with clearly labelled sample data.
 */
import { config as dotenv } from 'dotenv';
import { affiliateEnvFrom, type AffiliateEnv } from '@akaya/affiliate';
import { z } from 'zod';

// backend/.env wins over the agent-root .env
dotenv({ path: ['.env', '../.env'], quiet: true });

const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const Env = z.object({
  PORT: z.coerce.number().default(8787),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('*'),
  /** comma list: mock,amazon,flipkart,serpapi,browser */
  PROVIDERS: z.string().default('mock'),
  DATA_FILE: z.string().default('data/db.json'),
  CACHE_TTL_SECONDS: z.coerce.number().default(600),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().default(600),
  SEARCH_RATE_LIMIT_PER_MINUTE: z.coerce.number().default(60),
  QUEUE_CONCURRENCY: z.coerce.number().default(4),
  MOCK_LATENCY_MS: z.coerce.number().default(350),
  /** how often the price-alert checker runs (mock prices drift so alerts can fire in demos) */
  PRICE_CHECK_INTERVAL_MS: z.coerce.number().default(30000),

  // Amazon Associates: Creators API (PA-API 5.0 was retired on 15 May 2026)
  AMAZON_CREDENTIAL_ID: z.string().optional(),
  AMAZON_CREDENTIAL_SECRET: z.string().optional(),
  /** Associates tag for amazon.in (also used as the Creators API partnerTag) */
  AMAZON_TAG_IN: z.string().optional(),
  /** India = EU credential version 3.2 */
  AMAZON_TOKEN_URL: z.string().default('https://api.amazon.co.uk/auth/o2/token'),
  AMAZON_MARKETPLACE: z.string().default('www.amazon.in'),
  // Flipkart Affiliate
  FLIPKART_AFFILIATE_ID: z.string().optional(),
  FLIPKART_AFFILIATE_TOKEN: z.string().optional(),
  // SerpApi (Google Shopping)
  SERPAPI_KEY: z.string().optional(),
  // Browser-agent fallback (off by default: see docs/PROVIDERS.md for ToS / blocking risk)
  ENABLE_BROWSER_FALLBACK: bool,

  // Notifications
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  FCM_PROJECT_ID: z.string().optional(),
  FCM_SERVICE_ACCOUNT_JSON: z.string().optional(),
  /** optional Redis for cache/queue in production (see ARCHITECTURE.md) */
  REDIS_URL: z.string().optional(),
});

/** parsed env + every affiliate ID @akaya/affiliate knows about (AMAZON_TAG_*, FLIPKART_AFFILIATE_ID, CUELINKS_CID, …) */
export type Config = z.infer<typeof Env> & { affiliate: AffiliateEnv };
export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => ({
  ...Env.parse(env),
  affiliate: affiliateEnvFrom(env),
});
