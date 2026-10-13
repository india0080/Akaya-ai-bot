/**
 * One-off importer: converts the text extracted from the old Lovable site (akaya-voice-flow,
 * scripts/voice-flow-pages.json, captured with puppeteer from the rendered pages) into typed
 * content files in src/content/pages/*.ts. Re-run only if you re-extract; edit the TS files after that.
 */
import fs from 'node:fs';
const src = JSON.parse(fs.readFileSync(new URL('./voice-flow-pages.json', import.meta.url)));
const KW = {
  '/overview': ['akaya overview', 'voice-first ai assistant', 'ai agents', 'ai image generation', 'web reader ai'],
  '/about': ['about akaya', 'akaya ai company', 'personal ai assistant company'],
  '/pricing': ['akaya pricing', 'ai assistant pricing', 'lifetime ai assistant', 'ai credits plan'],
  '/faq': ['akaya faq', 'offline ai questions', 'ai assistant help'],
  '/support': ['akaya support', 'ai assistant troubleshooting', 'help center'],
  '/get-started': ['try akaya', 'free ai assistant account', 'download ai assistant'],
  '/app': ['talk to ai', 'voice ai chat online', 'ai web reader'],
  '/agents/shopping': ['ai shopping assistant', 'compare products ai', 'best deals ai agent'],
  '/agents/grocery': ['ai grocery assistant', 'grocery list ai', 'voice grocery shopping'],
  '/agents/job-search': ['ai job search assistant', 'ai job finder', 'job search agent'],
  '/agents/finance': ['ai finance assistant', 'expense tracker ai', 'personal finance ai'],
  '/agents/phone': ['phone ai assistant', 'ai phone control', 'android ai agent'],
  '/ai-assistant-india': ['ai assistant app india', 'hindi voice assistant', 'hinglish ai assistant', 'ai assistant in hindi'],
  '/ai-assistant-canada': ['ai assistant canada', 'voice ai assistant canada', 'french english ai assistant'],
  '/privacy': ['akaya privacy policy'],
  '/terms': ['akaya terms of service'],
  '/refund-policy': ['akaya refund policy', 'subscription cancellation'],
};
const KIND = (p) => p.startsWith('/agents/') ? 'agent' : ['/privacy', '/terms', '/refund-policy'].includes(p) ? 'legal' : p.startsWith('/ai-assistant-') ? 'region' : p === '/faq' ? 'faq' : p === '/pricing' ? 'pricing' : 'generic';
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'section';
const isLabel = (t) => t.length < 24 && !/[.?!]$/.test(t);
function convert(sec, kind) {
  const out = { id: slugify(sec.heading), heading: sec.heading, body: [], items: [], faqs: [], bullets: [] };
  const b = sec.blocks;
  for (let i = 0; i < b.length; i++) {
    const { t, x } = b[i]; const next = b[i + 1];
    if ((t === 'button' || t === 'summary' || t === 'dt') && x.endsWith('?') && next && (next.t === 'p' || next.t === 'dd')) { out.faqs.push({ q: x, a: next.x }); i++; continue; }
    if (t === 'button' || t === 'a') continue;
    if ((t === 'h3' || t === 'h4') ) { const txt0 = next && next.t === 'p' ? next.x : ''; if (x.endsWith('?') && txt0) { out.faqs.push({ q: x, a: txt0 }); i++; continue; } const txt = next && next.t === 'p' && next.x.length > 20 ? next.x : undefined; out.items.push(txt ? { title: x, text: txt } : { title: x }); if (txt) i++; continue; }
    if (t === 'li') { out.bullets.push(x); continue; }
    if (t === 'p') { if (kind === 'legal' ? x.length > 2 : x.length >= 40 || (/[.!?]$/.test(x) && x.length > 25)) out.body.push(x); else if (kind !== 'legal' && !isLabel(x) && x.length > 12) out.bullets.push(x); }
  }
  for (const k of ['body', 'items', 'faqs', 'bullets']) { if (!out[k].length) delete out[k]; else out[k] = [...new Map(out[k].map((v) => [JSON.stringify(v), v])).values()]; }
  return out;
}
const COLORS = ['blue', 'violet', 'cyan', 'green', 'orange', 'pearl', 'cream', 'black'];
const index = [];
for (const [path, page] of Object.entries(src)) {
  if (path === '/') continue; // home is hand-authored in src/content/home.ts
  const kind = KIND(path);
  const secs = page.sections.filter((s) => s.heading || s.blocks.length).map((s) => convert(s, kind));
  const [hero, ...sections] = secs;
  const key = path.slice(1).replace(/\//g, '-');
  const name = page.title.split(/ [—–|-] /)[0];
  const crumbs = [{ name: 'Home', path: '/' }];
  if (path.startsWith('/agents/')) crumbs.push({ name: 'Agents', path: '/overview' });
  crumbs.push({ name, path });
  const content = {
    key, kind, path, bubble: COLORS[index.length % COLORS.length],
    seo: { title: page.title, description: page.description, keywords: KW[path] ?? [], path, breadcrumbs: crumbs },
    hero, sections,
  };
  const varName = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  fs.writeFileSync(new URL(`../src/content/pages/${key}.ts`, import.meta.url),
    `// Imported from akaya-voice-flow by scripts/import-voice-flow.mjs. Safe to edit by hand (or from the admin panel later).\nimport type { PageContent } from '../types';\n\nconst ${varName}: PageContent = ${JSON.stringify(content, null, 2)};\n\nexport default ${varName};\n`);
  index.push({ key, varName });
}
fs.writeFileSync(new URL('../src/content/pages/index.ts', import.meta.url),
  `// Generated by scripts/import-voice-flow.mjs: every imported page, keyed by URL path.\nimport type { PageContent } from '../types';\n${index.map((p) => `import ${p.varName} from './${p.key}';`).join('\n')}\n\nexport const importedPages: PageContent[] = [${index.map((p) => p.varName).join(', ')}];\n`);
console.log('pages', index.length);
