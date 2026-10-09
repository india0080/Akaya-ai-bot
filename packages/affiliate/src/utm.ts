/** UTM tagging: utm_source=akaya, utm_medium=app, utm_campaign, utm_content. */

/** campaign/content tags: lower-case [a-z0-9_-], max 64 chars */
export function cleanTag(v: string | undefined | null): string | null {
  if (typeof v !== 'string') return null;
  const t = v
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return t || null;
}

export interface Utm {
  campaign?: string | null;
  content?: string | null;
  medium?: string | null;
}

/** Adds UTM parameters to an http(s) URL. Other schemes (sms:, sgnl:, uber:) are returned unchanged. */
export function withUtm(url: string, utm: Utm): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return url;
  u.searchParams.set('utm_source', 'akaya');
  u.searchParams.set('utm_medium', cleanTag(utm.medium) ?? 'app');
  u.searchParams.set('utm_campaign', cleanTag(utm.campaign) ?? 'general');
  const content = cleanTag(utm.content);
  if (content) u.searchParams.set('utm_content', content);
  return u.toString();
}
