import { loadConfig } from './config.js';
import { buildApp } from './app.js';
import { Store } from './store.js';

const cfg = (() => {
  try {
    return loadConfig();
  } catch (e) {
    console.error('Invalid configuration (see .env.example):', e instanceof Error ? e.message : e);
    process.exit(1);
  }
})();

const app = buildApp(cfg, new Store(cfg.DATA_FILE || null), { logger: true });
await app.listen({ port: cfg.PORT, host: '0.0.0.0' });
