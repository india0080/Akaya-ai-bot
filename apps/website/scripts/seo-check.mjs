/** Post-build SEO check on dist/: JSON-LD parses, one H1, title/description/canonical present, sitemap + robots + llms. */
import fs from 'node:fs';
import path from 'node:path';
const dist = new URL('../dist/', import.meta.url).pathname;
const html = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory() && e.name !== 'assets') walk(p); else if (e.name === 'index.html') html.push(p); });
walk(dist);
let bad = 0; let ld = 0; const types = new Set();
for (const f of html) {
  const s = fs.readFileSync(f, 'utf8'); const rel = path.relative(dist, f);
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(m[1]); ld++; [].concat(j['@type']).forEach((t) => types.add(t)); } catch (e) { bad++; console.log(`✖ ${rel}: invalid JSON-LD ${e.message}`); }
  }
  const h1 = (s.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) { bad++; console.log(`✖ ${rel}: ${h1} <h1>`); }
  for (const t of ['<title>', 'name="description"', 'rel="canonical"', 'property="og:image"']) if (!s.includes(t)) { bad++; console.log(`✖ ${rel}: missing ${t}`); }
  for (const m of s.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) { bad++; console.log(`✖ ${rel}: <img> without alt`); }
}
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const urls = (sitemap.match(/<loc>/g) || []).length;
const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
const bots = ['Googlebot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Bingbot', 'Applebot-Extended', 'CCBot'].filter((b) => !robots.includes(`User-agent: ${b}`));
if (bots.length) { bad++; console.log('✖ robots.txt missing', bots); }
if (!robots.includes('Sitemap:')) { bad++; console.log('✖ robots.txt has no Sitemap'); }
for (const f of ['llms.txt', 'llms-full.txt', 'rss.xml']) if (!fs.existsSync(path.join(dist, f))) { bad++; console.log(`✖ missing ${f}`); }
console.log(`${html.length} HTML pages · ${ld} JSON-LD blocks (${[...types].sort().join(', ')}) · sitemap ${urls} URLs · robots OK for ${10 - bots.length}/10 bots · ${bad} problem(s)`);
process.exit(bad ? 1 : 0);
