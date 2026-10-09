/** Writes docs/openapi.json from the live route schemas. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/app.js';

const app = await buildApp(loadConfig({ ...process.env, PROVIDERS: 'mock' }), { persist: false, watchers: false });
await app.ready();
mkdirSync('../docs', { recursive: true });
writeFileSync('../docs/openapi.json', JSON.stringify(app.swagger(), null, 2));
console.log('wrote ../docs/openapi.json');
await app.close();
