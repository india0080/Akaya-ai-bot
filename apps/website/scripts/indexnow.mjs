/** Submit every sitemap URL to IndexNow (Bing, Yandex, Seznam, Naver…). Needs INDEXNOW_KEY and a deployed /<key>.txt. */
import fs from 'node:fs';
const key = process.env.INDEXNOW_KEY;
const site = (process.env.VITE_SITE_URL || 'https://akaya.one').replace(/\/$/, '');
if (!key) { console.error('Set INDEXNOW_KEY (see docs/INTEGRATIONS.md).'); process.exit(1); }
const urlList = [...fs.readFileSync(new URL('../dist/sitemap.xml', import.meta.url), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList }),
});
console.log(`IndexNow: ${res.status} for ${urlList.length} URLs`);
