/**
 * Typed configuration from environment variables (.env). Every key is optional: with no keys the
 * agent runs on Mock store providers with clearly labelled sample data.
 */
import { config as dotenv } from 'dotenv';
import { z } from 'zod';

// backend/.env wins over the agent-root .env
dotenv({ path: ['.env', '../.env'], quiet: true });

const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const Env = z.object({
  PORT: z.coerce.number().default(8788),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('*'),
  /** comma list: mock, instamart, blinkit, zepto, bigbasket, amazon-fresh */
  PROVIDERS: z.string().default('mock'),
  DATA_FILE: z.string().default('data/db.json'),
  CACHE_TTL_SECONDS: z.coerce.number().default(300),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().default(600),
  QUOTE_RATE_LIMIT_PER_MINUTE: z.coerce.number().default(60),
  QUEUE_CONCURRENCY: z.coerce.number().default(4),
  MOCK_LATENCY_MS: z.coerce.number().default(300),
  /** delivery address used for serviceability / ETA (sample default) */
  DEFAULT_PINCODE: z.string().default('560034'),
  DEFAULT_ADDRESS: z.string().default('Koramangala, Bengaluru'),
  /** a filled cart's prices are held for this long before we ask the user to re-check */
  PAYMENT_WINDOW_MINUTES: z.coerce.number().default(15),
  /** schedule runner tick (weekly lists) */
  SEED_SAMPLE_LISTS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true')
    .describe('create sample saved lists for the demo user on first run'),
  SCHEDULE_TICK_MS: z.coerce.number().default(60000),
  /** mock order-tracking speed multiplier (1 = real time) */
  ORDER_SIM_SPEED: z.coerce.number().default(20),

  // Playwright adapters (user's own logged-in session). OFF unless ENABLE_PLAYWRIGHT=true.
  ENABLE_PLAYWRIGHT: bool,
  PLAYWRIGHT_HEADLESS: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  INSTAMART_STORAGE_STATE: z.string().optional(),
  BLINKIT_STORAGE_STATE: z.string().optional(),
  ZEPTO_STORAGE_STATE: z.string().optional(),
  BIGBASKET_STORAGE_STATE: z.string().optional(),
  AMAZON_FRESH_STORAGE_STATE: z.string().optional(),

  // Official store MCP servers (partner route; preferred over Playwright). Token = the user's OAuth access token.
  INSTAMART_MCP_URL: z.string().default('https://mcp.swiggy.com/im'),
  INSTAMART_MCP_TOKEN: z.string().optional(),
  ZEPTO_MCP_URL: z.string().default('https://mcp.zepto.co.in/mcp'),
  ZEPTO_MCP_TOKEN: z.string().optional(),

  // Notifications
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  FCM_PROJECT_ID: z.string().optional(),
  FCM_SERVICE_ACCOUNT_JSON: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export type Config = z.infer<typeof Env>;
export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => Env.parse(env);
