/** Builds the <head> HTML for a prerendered page: meta, canonical, OG/Twitter, hreflang, JSON-LD, integrations. */
import { config } from '../config/env';
import { site } from '../config/site';
import { abs, type JsonLd } from './jsonld';
import { integrationsHead } from './integrations';

export interface HeadInput {
  title: string;
  description: string;
  keywords: string[];
  path: string;
  ogImage: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  hreflang?: Record<string, string>;
  canonical?: string;
  jsonLd: JsonLd[];
  published?: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const meta = (k: string, v: string, attr = 'name') => (v ? `<meta ${attr}="${k}" content="${esc(v)}">` : '');

export function renderHead(h: HeadInput): string {
  const url = h.canonical ?? abs(h.path);
  const img = abs(h.ogImage);
  return [
    `<title>${esc(h.title)}</title>`,
    meta('description', h.description),
    meta('keywords', h.keywords.join(', ')),
    meta('robots', h.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'),
    `<link rel="canonical" href="${esc(url)}">`,
    ...Object.entries(h.hreflang ?? {}).map(([lang, p]) => `<link rel="alternate" hreflang="${lang}" href="${abs(p)}">`),
    meta('og:type', h.ogType ?? 'website', 'property'),
    meta('og:site_name', site.name, 'property'),
    meta('og:locale', site.locale, 'property'),
    meta('og:title', h.title, 'property'),
    meta('og:description', h.description, 'property'),
    meta('og:url', url, 'property'),
    meta('og:image', img, 'property'),
    meta('og:image:width', '1200', 'property'),
    meta('og:image:height', '630', 'property'),
    meta('article:published_time', h.published ?? '', 'property'),
    meta('twitter:card', 'summary_large_image'),
    meta('twitter:site', site.twitter),
    meta('twitter:title', h.title),
    meta('twitter:description', h.description),
    meta('twitter:image', img),
    `<meta name="theme-color" content="#7625ef">`,
    `<link rel="icon" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
    `<link rel="alternate" type="application/rss+xml" title="Akaya Blog" href="/rss.xml">`,
    `<script>(function(){try{var t=localStorage.getItem('akaya-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var q=new URLSearchParams(location.search).get('theme');document.documentElement.dataset.theme=q||t}catch(e){}})()</script>`,
    ...h.jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
    integrationsHead(config),
  ].filter(Boolean).join('\n    ');
}
