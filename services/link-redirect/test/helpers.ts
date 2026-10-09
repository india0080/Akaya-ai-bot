import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/app.js';
import { Store } from '../src/store.js';

export const TOKEN = 'test-admin-token-0123456789';
export const auth = { authorization: `Bearer ${TOKEN}` };

/** in-memory app with fake affiliate IDs (never real ones in tests) */
export function makeApp(extra: Record<string, string> = {}, now = () => Date.parse('2026-10-09T10:00:00+05:30')) {
  const cfg = loadConfig({
    ADMIN_TOKEN: TOKEN,
    ANON_SALT: 'test-salt-0123456789',
    DATA_FILE: '',
    AMAZON_TAG_IN: 'akaya-21',
    BOOKING_AID: '1234567',
    ...extra,
  });
  const store = new Store(null);
  return { app: buildApp(cfg, store, { now }), store };
}
