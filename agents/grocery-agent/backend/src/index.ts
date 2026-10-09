import { loadConfig } from './config.js';
import { buildApp } from './app.js';

const cfg = loadConfig();
const app = await buildApp(cfg, { logger: true });
await app.listen({ port: cfg.PORT, host: cfg.HOST });
const kinds = [...app.services.providers.values()].map((p) => p.id).join(', ');
app.log.info(`Akaya Grocery Agent API on http://localhost:${cfg.PORT}  ·  docs: /docs  ·  stores: ${kinds}`);
for (const sig of ['SIGINT', 'SIGTERM'] as const) process.on(sig, () => void app.close().then(() => process.exit(0)));
