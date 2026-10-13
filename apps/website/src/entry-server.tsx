import { renderToString } from 'react-dom/server';
import { App } from './App';
import { config } from './config/env';
import { site } from './config/site';
import { posts } from './content/blog';
import { content } from './services/content';
import { listRoutes, ogPath, resolveRoute } from './routes';
import { renderHead } from './seo/head';
import { gtmNoscript } from './seo/integrations';

/** Used by scripts/prerender.mjs. */
export function render(path: string) {
  const r = resolveRoute(path);
  return { html: renderToString(<App path={path} />), head: renderHead(r.head), status: r.status, noindex: Boolean(r.head.noindex), title: r.head.title, description: r.head.description, bodyStart: gtmNoscript(config.gtmId) };
}

export { listRoutes, ogPath };
export const siteInfo = { url: config.siteUrl, name: site.name, description: site.description, indexNowKey: '' };
export const pagesForLlms = () => content.listPages().filter((p) => !p.seo.noindex);
export const postsForFeeds = () => posts;
