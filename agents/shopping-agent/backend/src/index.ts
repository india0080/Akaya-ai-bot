import { loadConfig } from './config.js';
import { buildApp } from './app.js';

const cfg = loadConfig();
const app = await buildApp(cfg, { logger: true });
await app.listen({ port: cfg.PORT, host: cfg.HOST });
app.log.info(`Akaya Shopping Agent API on http://localhost:${cfg.PORT}  ·  docs: /docs  ·  providers: ${app.services.search.providers.map((p) => p.id).join(', ')}`);
for (const sig of ['SIGINT', 'SIGTERM'] as const) process.on(sig, () => void app.close().then(() => process.exit(0)));
