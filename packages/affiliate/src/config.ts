/** Which env vars hold affiliate IDs, and helpers to read them from process.env / import.meta.env. */
import { networkEnvVars } from './networks.js';
import { PLATFORMS } from './platforms.js';
import type { AffiliateEnv, PlatformDef } from './types.js';

const AMAZON_MARKET_KEYS = ['IN', 'US', 'UK', 'DE', 'CA', 'AE', 'JP'];

/** every env var a platform can read (direct programme first, then networks) */
export function envVarsFor(plat: PlatformDef): string[] {
  const out: string[] = [];
  const p = plat.affiliate.param;
  if (p) {
    const env = p.env;
    if (typeof env === 'string') out.push(env);
    else out.push(...AMAZON_MARKET_KEYS.map((m) => env({ market: m.toLowerCase() })));
  }
  for (const n of plat.affiliate.networks ?? []) out.push(...networkEnvVars(n, plat.id));
  return [...new Set(out)];
}

/** all affiliate env vars, sorted (used for .env.example and docs checks) */
export function allEnvVars(): string[] {
  return [...new Set(Object.values(PLATFORMS as Record<string, PlatformDef>).flatMap(envVarsFor))].sort();
}

/**
 * Picks affiliate IDs out of an env object. With a prefix (e.g. "VITE_AFF_" for the app build) the prefix
 * is stripped: VITE_AFF_BOOKING_AID → BOOKING_AID. Only known affiliate variables are copied.
 */
export function affiliateEnvFrom(source: Record<string, unknown>, prefix = ''): AffiliateEnv {
  const known = new Set(allEnvVars());
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(source)) {
    if (typeof v !== 'string' || !k.startsWith(prefix)) continue;
    const name = k.slice(prefix.length);
    if (known.has(name) && v.trim()) out[name] = v.trim();
  }
  return out;
}
