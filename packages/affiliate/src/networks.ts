/**
 * Affiliate network wrappers. A network takes the merchant URL and returns a tracking URL that redirects
 * to it. Each needs IDs from env (never hard-coded). Formats follow each network's documented deep-link syntax;
 * confirm in your dashboard before going live (see docs/AFFILIATE.md).
 */
import { enc } from './safe.js';
import type { AffiliateEnv, NetworkId } from './types.js';

export interface NetworkDef {
  id: NetworkId;
  name: string;
  signup: string;
  /** env vars this network reads; `{PLATFORM}` is replaced by the upper-snake platform id */
  env: string[];
  /** returns null when the needed IDs are not configured */
  wrap(url: string, ctx: { platform: string; env: AffiliateEnv; sub: string | null }): string | null;
}

const key = (platform: string) => platform.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
const get = (env: AffiliateEnv, name: string) => {
  const v = env[name];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
};

/** `{url}` (encoded) or `{rawurl}` placeholder templates, for programmes that hand you a link template */
function fromTemplate(tpl: string | null, url: string): string | null {
  if (!tpl) return null;
  if (tpl.includes('{url}')) return tpl.replace('{url}', enc(url));
  if (tpl.includes('{rawurl}')) return tpl.replace('{rawurl}', url);
  return null;
}

export const NETWORKS: Record<NetworkId, NetworkDef> = {
  cuelinks: {
    id: 'cuelinks',
    name: 'Cuelinks',
    signup: 'https://www.cuelinks.com/',
    env: ['CUELINKS_CID'],
    wrap(url, { env, sub }) {
      const cid = get(env, 'CUELINKS_CID');
      if (!cid) return null;
      return `https://linksredirect.com/?cid=${enc(cid)}&source=linkkit&url=${enc(url)}${sub ? `&subid=${enc(sub)}` : ''}`;
    },
  },
  admitad: {
    id: 'admitad',
    name: 'Admitad',
    signup: 'https://www.admitad.com/',
    env: ['ADMITAD_CODE_{PLATFORM}'],
    wrap(url, { platform, env, sub }) {
      const code = get(env, `ADMITAD_CODE_${key(platform)}`);
      if (!code || !/^[A-Za-z0-9]+$/.test(code)) return null;
      return `https://ad.admitad.com/g/${code}/?ulp=${enc(url)}${sub ? `&subid=${enc(sub)}` : ''}`;
    },
  },
  earnkaro: {
    id: 'earnkaro',
    name: 'EarnKaro',
    signup: 'https://earnkaro.com/',
    // EarnKaro converts links through its app/API ("profit links"); paste the template they give you.
    env: ['EARNKARO_LINK_TEMPLATE'],
    wrap(url, { env }) {
      return fromTemplate(get(env, 'EARNKARO_LINK_TEMPLATE'), url);
    },
  },
  cj: {
    id: 'cj',
    name: 'CJ Affiliate',
    signup: 'https://www.cj.com/',
    env: ['CJ_PID'],
    wrap(url, { env, sub }) {
      const pid = get(env, 'CJ_PID');
      if (!pid || !/^\d+$/.test(pid)) return null;
      return `https://www.anrdoezrs.net/links/${pid}/type/dlg/${sub ? `sid/${enc(sub)}/` : ''}${url}`;
    },
  },
  travelpayouts: {
    id: 'travelpayouts',
    name: 'Travelpayouts',
    signup: 'https://www.travelpayouts.com/',
    env: ['TRAVELPAYOUTS_MARKER', 'TRAVELPAYOUTS_P_{PLATFORM}', 'TRAVELPAYOUTS_TRS'],
    wrap(url, { platform, env, sub }) {
      const marker = get(env, 'TRAVELPAYOUTS_MARKER');
      const p = get(env, `TRAVELPAYOUTS_P_${key(platform)}`);
      if (!marker || !p) return null;
      const trs = get(env, 'TRAVELPAYOUTS_TRS');
      const m = sub ? `${marker}.${sub.replace(/[^A-Za-z0-9_-]/g, '')}` : marker;
      return `https://tp.media/r?marker=${enc(m)}${trs ? `&trs=${enc(trs)}` : ''}&p=${enc(p)}&u=${enc(url)}`;
    },
  },
  impact: {
    id: 'impact',
    name: 'Impact',
    signup: 'https://impact.com/',
    // the tracking base Impact gives you per brand, e.g. https://brand.pxf.io/c/1234567/890123/12345
    env: ['IMPACT_BASE_{PLATFORM}'],
    wrap(url, { platform, env, sub }) {
      const base = get(env, `IMPACT_BASE_${key(platform)}`);
      if (!base || !/^https:\/\/[^\s?#]+$/.test(base)) return null;
      return `${base}?u=${enc(url)}${sub ? `&subId1=${enc(sub)}` : ''}`;
    },
  },
};

/** env var names for a network + platform (placeholders resolved) */
export function networkEnvVars(network: NetworkId, platform: string): string[] {
  return NETWORKS[network].env.map((e) => e.replace('{PLATFORM}', key(platform)));
}
