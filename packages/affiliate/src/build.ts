/** buildLink: platform + intent + params → { appUri, webUrl, trackedUrl } with affiliate tag and UTM. */
import { NETWORKS } from './networks.js';
import { getPlatform } from './platforms.js';
import { cleanTag, withUtm } from './utm.js';
import { LinkError, type AffiliateEnv, type BuildLinkInput, type BuiltLink, type PlatformDef } from './types.js';

const ID_VALUE = /^[A-Za-z0-9._-]{1,64}$/;

/** the env var name for a platform's direct programme ID (null when it has none) */
export function paramEnvName(plat: PlatformDef, params: BuildLinkInput['params'] = {}): string | null {
  const p = plat.affiliate.param;
  if (!p) return null;
  return typeof p.env === 'function' ? p.env(params) : p.env;
}

function applyParam(url: string, plat: PlatformDef, input: BuildLinkInput, env: AffiliateEnv, sub: string | null) {
  const p = plat.affiliate.param;
  const name = paramEnvName(plat, input.params);
  const value = name ? env[name]?.trim() : undefined;
  if (!p || !value || !ID_VALUE.test(value)) return null;
  const u = new URL(url);
  u.searchParams.set(p.name, value);
  if (p.sub && sub) u.searchParams.set(p.sub, sub);
  return { url: u.toString(), via: `param:${p.name}` };
}

export function buildLink(input: BuildLinkInput): BuiltLink {
  const plat = getPlatform(input.platform);
  if (!plat) throw new LinkError(`unknown platform "${input.platform}"`);
  const make = plat.intents[input.intent];
  if (!make) throw new LinkError(`${plat.name} does not support intent "${input.intent}"`);
  const params = input.params ?? {};
  const webUrl = make(params);
  if (!webUrl) throw new LinkError(`${plat.name} ${input.intent}: missing or invalid params`);
  const appUri = plat.scheme?.[input.intent]?.(params) ?? null;

  const campaign = cleanTag(input.campaign);
  const content = cleanTag(input.content);
  const sub = content ?? campaign;
  const env = input.env ?? {};

  // messaging links carry user text only: no tracking parameters
  let trackedUrl =
    plat.category === 'messaging' ? webUrl : withUtm(webUrl, { campaign, content, medium: input.medium });
  let via: string | null = null;

  if (plat.category !== 'messaging') {
    const direct = applyParam(trackedUrl, plat, input, env, sub);
    if (direct) ({ url: trackedUrl, via } = direct);
    else
      for (const n of plat.affiliate.networks ?? []) {
        const wrapped = NETWORKS[n].wrap(trackedUrl, { platform: plat.id, env, sub });
        if (wrapped) {
          trackedUrl = wrapped;
          via = `network:${n}`;
          break;
        }
      }
  }

  return {
    platform: plat.id,
    intent: input.intent,
    appUri,
    webUrl,
    trackedUrl,
    androidPackage: plat.android ?? null,
    affiliate: { active: via !== null, via },
  };
}

/** like buildLink but returns null instead of throwing (UI convenience) */
export function tryBuildLink(input: BuildLinkInput): BuiltLink | null {
  try {
    return buildLink(input);
  } catch (e) {
    if (e instanceof LinkError) return null;
    throw e;
  }
}
