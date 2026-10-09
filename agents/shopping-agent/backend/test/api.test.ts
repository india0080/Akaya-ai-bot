import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

let app: Awaited<ReturnType<typeof buildApp>>;
beforeAll(async () => {
  app = await buildApp(loadConfig({ MOCK_LATENCY_MS: '5', PRICE_CHECK_INTERVAL_MS: '0' }), { persist: false, watchers: false });
  await app.ready();
});
afterAll(() => app.close());

const search = async (query: string, extra: object = {}) => {
  const r = await app.inject({ method: 'POST', url: '/api/search', payload: { query, wait: true, ...extra } });
  expect(r.statusCode).toBe(200);
  return r.json();
};

describe('API', () => {
  it('health + providers report Mock as sample data', async () => {
    expect((await app.inject('/api/health')).json().ok).toBe(true);
    const p = (await app.inject('/api/providers')).json();
    expect(p.active).toEqual(['mock']);
    const mock = p.providers.find((x: { id: string }) => x.id === 'mock');
    expect(mock.sampleData).toBe(true);
    expect(p.providers.filter((x: { configured: boolean; id: string }) => x.id !== 'mock' && x.configured)).toEqual([]);
  });
  it('search returns ranked, badged, labelled sample results', async () => {
    const j = await search('school bag under 1500');
    expect(j.status).toBe('done');
    const r = j.result;
    expect(r.sample).toBe(true);
    expect(r.products.length).toBeGreaterThan(2);
    for (const p of r.products) expect(p.best.price).toBeLessThanOrEqual(1500);
    expect(r.products.flatMap((p: { badges: string[] }) => p.badges)).toContain('best_price');
  });
  it('second identical search is served from cache', async () => {
    await search('smartwatch');
    const again = await search('smartwatch');
    expect(again.result.cached).toBe(true);
  });
  it('Hinglish search works end to end', async () => {
    const j = await search('2000 se kam ke joote');
    expect(j.result.parsed.q).toContain('shoes');
    expect(j.result.products.length).toBeGreaterThan(0);
  });
  it('validates input with zod', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/search', payload: { query: '' } });
    expect(r.statusCode).toBe(400);
  });
  it('product, history, compare', async () => {
    const r = (await search('earbuds')).result;
    const [a, b] = r.products;
    const p = (await app.inject(`/api/products/${a.key}`)).json();
    expect(p.offers.length).toBeGreaterThan(0);
    const h = (await app.inject(`/api/products/${a.key}/history?days=30`)).json();
    expect(h.series[0].points.length).toBeGreaterThanOrEqual(30);
    expect(['great', 'good', 'wait']).toContain(h.verdict);
    const c = await app.inject({ method: 'POST', url: '/api/compare', payload: { keys: [a.key, b.key] } });
    expect(c.statusCode).toBe(200);
    expect(c.json().rows.length).toBeGreaterThan(5);
  });
  it('watchlist → price check → notification', async () => {
    const r = (await search('power bank')).result;
    const best = r.products[0].best;
    const add = await app.inject({ method: 'POST', url: '/api/watchlist', payload: { offerId: best.id, targetPrice: best.price * 10 } });
    expect(add.statusCode).toBe(201);
    const chk = (await app.inject({ method: 'POST', url: '/api/watchlist/check', payload: {} })).json();
    expect(chk.alerts.length).toBe(1);
    const n = (await app.inject('/api/notifications')).json();
    expect(n[0].kind).toBe('price_drop');
    expect(n[0].body).toContain('Sample data');
    const list = (await app.inject('/api/watchlist')).json();
    const del = await app.inject({ method: 'DELETE', url: `/api/watchlist/${list[0].id}` });
    expect(del.statusCode).toBe(204);
  });
  it('per-user isolation via x-user-id', async () => {
    const list = (await app.inject({ url: '/api/watchlist', headers: { 'x-user-id': 'rahul' } })).json();
    expect(list).toEqual([]);
  });
  it('allows PATCH/DELETE cross-origin (CORS preflight)', async () => {
    const r = await app.inject({ method: 'OPTIONS', url: '/api/watchlist/x', headers: { origin: 'http://localhost:5174', 'access-control-request-method': 'PATCH', 'access-control-request-headers': 'content-type,x-user-id' } });
    expect(r.statusCode).toBe(204);
    expect(String(r.headers['access-control-allow-methods'])).toContain('PATCH');
    expect(String(r.headers['access-control-allow-methods'])).toContain('DELETE');
  });
  it('serves the OpenAPI spec', async () => {
    const s = (await app.inject('/docs/json')).json();
    expect(s.openapi).toMatch(/^3/);
    expect(Object.keys(s.paths)).toEqual(expect.arrayContaining(['/api/search', '/api/jobs/{id}', '/api/watchlist', '/api/compare']));
  });
});
