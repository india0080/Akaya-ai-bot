/**
 * SEO lint for blog posts and page content (run before publishing; exits 1 on errors).
 * Checks: title 30-60 chars, description 70-160, keywords, slug, one H1 (title) + H2s, heading order,
 * image alt text, at least 2 internal links, links resolve to known routes, FAQ shape, sample/draft flags.
 */
import fs from 'node:fs';
import { parse } from 'yaml';
const dir = new URL('../src/content/blog/', import.meta.url);
const pagesDir = new URL('../src/content/pages/', import.meta.url);
const known = new Set(['/', '/blog', '/login', '/signup', '/forgot-password', '/rss.xml',
  ...fs.readdirSync(pagesDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts').map((f) => fs.readFileSync(new URL(f, pagesDir), 'utf8').match(/"path": "([^"]+)"/)?.[1]).filter(Boolean)]);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
for (const f of files) known.add(`/blog/${f.replace(/\.md$/, '')}`);
let errors = 0; let warnings = 0;
const err = (f, m) => { errors++; console.log(`✖ ${f}: ${m}`); };
const warn = (f, m) => { warnings++; console.log(`⚠ ${f}: ${m}`); };
for (const f of files) {
  const raw = fs.readFileSync(new URL(f, dir), 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!m) { err(f, 'missing frontmatter'); continue; }
  const fm = parse(m[1]); const body = m[2];
  for (const k of ['title', 'description', 'keywords', 'slug', 'date', 'author', 'category', 'tags']) if (!fm[k] || (Array.isArray(fm[k]) && !fm[k].length)) err(f, `missing ${k}`);
  if (fm.title && (fm.title.length < 30 || fm.title.length > 65)) warn(f, `title is ${fm.title.length} chars (aim 30-60)`);
  if (fm.description && (fm.description.length < 70 || fm.description.length > 160)) warn(f, `description is ${fm.description.length} chars (aim 70-160)`);
  if (/TODO/.test(raw)) (fm.draft ? warn : err)(f, 'contains TODO');
  if (fm.slug && `${fm.slug}.md` !== f) err(f, `slug "${fm.slug}" does not match file name`);
  if (fm.cover && !fm.coverAlt) err(f, 'cover image needs coverAlt');
  if (/^# /m.test(body)) err(f, 'do not use "# H1" in the body (the title is the H1)');
  const heads = [...body.matchAll(/^(#{2,6}) /gm)].map((h) => h[1].length);
  if (heads.filter((h) => h === 2).length < 2) warn(f, 'use at least 2 H2 sections');
  heads.forEach((h, i) => { if (i && h > heads[i - 1] + 1) err(f, `heading jumps from H${heads[i - 1]} to H${h}`); });
  for (const img of body.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) if (!img[1].trim()) err(f, `image ${img[2]} has no alt text`);
  const internal = [...body.matchAll(/\]\((\/[^)#\s]*)/g)].map((l) => l[1].replace(/\/$/, '') || '/');
  if (internal.length < 2) warn(f, `only ${internal.length} internal link(s); aim for 2+`);
  for (const l of internal) if (!known.has(l) && !l.startsWith('/blog/')) err(f, `internal link ${l} does not match a known page`);
  const kw = fm.keywords?.[0]?.toLowerCase();
  if (kw && !(fm.title + ' ' + body.slice(0, 800)).toLowerCase().includes(kw)) warn(f, `main keyword "${kw}" not in title or intro`);
  for (const q of fm.faq ?? []) if (!q.q || !q.a) err(f, 'faq entries need q and a');
  if (fm.sample) warn(f, 'marked sample: replace before launch');
}
console.log(`\n${files.length} post(s): ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
