/**
 * Static site generation: renders every route to dist/<path>/index.html, then writes
 * sitemap.xml, robots.txt, llms.txt, llms-full.txt, rss.xml, OG images and the IndexNow key file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssr = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href);
// Images referenced only by prerendered HTML are emitted by the SSR build; ship them with the client.
const ssrAssets = path.join(root, 'dist-ssr/assets');
if (fs.existsSync(ssrAssets)) for (const f of fs.readdirSync(ssrAssets)) if (!f.endsWith('.js') && !f.endsWith('.css')) fs.copyFileSync(path.join(ssrAssets, f), path.join(dist, 'assets', f));
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const SITE = ssr.siteInfo.url;
const today = new Date().toISOString().slice(0, 10);

// Preload the two above-the-fold font files (Manrope 400/800 + Comfortaa 700).
const fonts = fs.readdirSync(path.join(dist, 'assets')).filter((f) => /^(manrope-latin-(400|700)|comfortaa-latin-700)-normal.*\.woff2$/.test(f));
const preload = fonts.map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin>`).join('\n    ');

const write = (rel, data) => { const f = path.join(dist, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const routes = ssr.listRoutes();
const indexable = [];
const ogJobs = [];
for (const route of routes) {
  const r = ssr.render(route);
  const html = template
    .replace('<!--head-->', `${r.head}\n    ${preload}`)
    .replace('<!--app-->', r.html)
    .replace('<body>', `<body>${r.bodyStart}`);
  write(route === '/' ? 'index.html' : `${route.slice(1)}/index.html`, html);
  if (!r.noindex) indexable.push(route);
  ogJobs.push({ file: ssr.ogPath(route), title: r.title.replace(/ [|–—] Akaya.*$/, ''), sub: r.description });
}
const nf = ssr.render('/404');
write('404.html', template.replace('<!--head-->', `${nf.head}\n    ${preload}`).replace('<!--app-->', nf.html));

// sitemap.xml
const prio = (u) => (u === '/' ? '1.0' : /^\/(pricing|overview|agents)/.test(u) ? '0.9' : u.startsWith('/blog/') ? '0.7' : '0.8');
const postDates = Object.fromEntries(ssr.postsForFeeds().map((p) => [`/blog/${p.slug}`, p.updated ?? p.date]));
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable
  .map((u) => `  <url><loc>${SITE}${u === '/' ? '/' : u}</loc><lastmod>${postDates[u] ?? today}</lastmod><priority>${prio(u)}</priority></url>`).join('\n')}\n</urlset>\n`);

// robots.txt: allow search + AI crawlers explicitly.
const bots = ['Googlebot', 'Bingbot', 'Applebot', 'Applebot-Extended', 'Google-Extended', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'CCBot', 'DuckDuckBot', 'YandexBot'];
write('robots.txt', `${bots.map((b) => `User-agent: ${b}\nAllow: /\n`).join('\n')}\nUser-agent: *\nAllow: /\nDisallow: /login\nDisallow: /signup\nDisallow: /forgot-password\n\nSitemap: ${SITE}/sitemap.xml\n`);

// llms.txt (index) + llms-full.txt (all page text).
const pages = ssr.pagesForLlms();
const posts = ssr.postsForFeeds();
const line = (p) => `- [${p.seo.title}](${SITE}${p.path}): ${p.seo.description}`;
const group = (kinds) => pages.filter((p) => kinds.includes(p.kind)).map(line).join('\n');
write('llms.txt', `# Akaya\n\n> ${ssr.siteInfo.description}\n\nAkaya is a software product (AI assistant app for Android, iOS, Windows and web), not a location or coworking space.\n\n## Product\n${group(['home', 'generic', 'pricing', 'faq'])}\n\n## Agents\n${group(['agent'])}\n\n## Regions\n${group(['region'])}\n\n## Blog\n${posts.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}`).join('\n')}\n\n## Legal\n${group(['legal'])}\n\n## Optional\n- [Full text for LLMs](${SITE}/llms-full.txt)\n- [Sitemap](${SITE}/sitemap.xml)\n`);
const secText = (s) => [`### ${s.heading}`, ...(s.body ?? []), ...(s.items ?? []).map((i) => `- ${i.title}${i.text ? `: ${i.text}` : ''}`), ...(s.bullets ?? []).filter((b) => b !== '|').map((b) => `- ${b}`), ...(s.faqs ?? []).map((f) => `Q: ${f.q}\nA: ${f.a}`)].join('\n');
write('llms-full.txt', `# Akaya — full site text\n\n${pages.map((p) => `## ${p.seo.title}\nURL: ${SITE}${p.path}\n\n${[p.hero, ...p.sections].map(secText).join('\n\n')}`).join('\n\n---\n\n')}\n\n---\n\n${posts.map((p) => `## ${p.title}\nURL: ${SITE}/blog/${p.slug}\n\n${p.html.replace(/<[^>]+>/g, '').trim()}`).join('\n\n---\n\n')}\n`);

// rss.xml
write('rss.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Akaya Blog</title><link>${SITE}/blog</link><description>Guides and news about Akaya AI.</description><atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>\n${posts
  .map((p) => `<item><title>${xml(p.title)}</title><link>${SITE}/blog/${p.slug}</link><guid>${SITE}/blog/${p.slug}</guid><pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate><category>${xml(p.category)}</category><description>${xml(p.description)}</description></item>`).join('\n')}\n</channel></rss>\n`);

// IndexNow key file
if (process.env.INDEXNOW_KEY) write(`${process.env.INDEXNOW_KEY}.txt`, process.env.INDEXNOW_KEY);

// OG images 1200x630 (brand gradient + pearl + title).
const pearl = fs.readFileSync(path.join(root, 'src/assets/img/akaya-bubble-pearl.webp'));
const pearlPng = (await sharp(pearl).resize(300, 300).png().toBuffer()).toString('base64');
const wrap = (t, n) => t.split(' ').reduce((acc, w) => { const l = acc[acc.length - 1]; if ((l + ' ' + w).trim().length > n) acc.push(w); else acc[acc.length - 1] = (l + ' ' + w).trim(); return acc; }, ['']);
const seen = new Set();
for (const j of ogJobs) {
  if (seen.has(j.file)) continue; seen.add(j.file);
  const tl = wrap(j.title, 26).slice(0, 3);
  const sl = wrap(j.sub, 58).slice(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7625ef"/><stop offset="1" stop-color="#0269f8"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><circle cx="1040" cy="90" r="220" fill="#fff" opacity=".08"/><image href="data:image/png;base64,${pearlPng}" x="840" y="220" width="300" height="300"/><text x="80" y="110" font-family="Comfortaa, Manrope, sans-serif" font-size="40" font-weight="700" fill="#fff">akaya</text>${tl.map((t, i) => `<text x="80" y="${250 + i * 74}" font-family="Manrope, sans-serif" font-size="64" font-weight="800" fill="#fff">${xml(t)}</text>`).join('')}${sl.map((t, i) => `<text x="80" y="${280 + tl.length * 74 + i * 38}" font-family="Manrope, sans-serif" font-size="28" fill="#fff" opacity=".85">${xml(t)}</text>`).join('')}</svg>`;
  write(j.file.slice(1), await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer());
}
console.log(`prerendered ${routes.length} routes, ${indexable.length} in sitemap, ${seen.size} OG images`);
