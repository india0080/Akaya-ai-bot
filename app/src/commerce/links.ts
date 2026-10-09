/**
 * App-side glue for @akaya/affiliate: every store / travel / food / ride button in the app builds its link here.
 * Affiliate IDs come from VITE_AFF_* at build time (empty = plain links with UTM only; see docs/AFFILIATE.md).
 */
import {
  affiliateEnvFrom,
  buildLink,
  getPlatform,
  type BuildLinkInput,
  type BuiltLink,
  type PlatformDef,
} from '@akaya/affiliate';

export const AFF_ENV = affiliateEnvFrom(import.meta.env, 'VITE_AFF_');

/** number of affiliate IDs baked into this build */
export const AFF_CONFIGURED = Object.keys(AFF_ENV).length;

/** link for an app surface; `campaign` names the screen (travel, deals, chat…) */
export const appLink = (input: Omit<BuildLinkInput, 'env' | 'medium'>): BuiltLink =>
  buildLink({ ...input, env: AFF_ENV });

/** a registry platform as an AppTile brand (logo when we have one, else monogram) */
export function platformBrand(id: string): { id: string; color: string; mono: string; darkText?: boolean } {
  const p: PlatformDef | undefined = getPlatform(id);
  return p ? { id: p.id, color: p.color, mono: p.mono, darkText: !!p.ink } : { id, color: '#64748b', mono: '•' };
}

export const platformName = (id: string) => getPlatform(id)?.name ?? id;

/** ₹ with Indian grouping */
export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
