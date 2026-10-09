import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

let app: Awaited<ReturnType<typeof buildApp>>;
beforeAll(async () => {
  app = await buildApp(loadConfig({ MOCK_LATENCY_MS: '0', ORDER_SIM_SPEED: '100000' }), { persist: false, timers: false });
  await app.ready();
});
afterAll(() => app.close());

const LIST = '2 kg aata, 1 L Amul milk, 6 eggs, 1 kg pyaz, sarson ka tel';
const quote = async (extra: object = {}) => {
  const r = await app.inject({ method: 'POST', url: '/api/quotes', payload: { text: LIST, wait: true, ...extra } });
  expect(r.statusCode).toBe(200);
  return r.json().result;
};
const waitCheckout = async (id: string) => {
  for (let i = 0; i < 200; i++) {
    const c = (await app.inject(`/api/checkouts/${id}`)).json();
    if (c.status !== 'filling') return c;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error('fill timeout');
};

describe('API', () => {
  it('health, providers (Mock = sample), stores', async () => {
    expect((await app.inject('/api/health')).json().ok).toBe(true);
    const p = (await app.inject('/api/providers')).json();
    expect(p.stores).toHaveLength(5);
    expect(p.stores.every((s: { active: { sampleData: boolean } }) => s.active.sampleData)).toBe(true);
    expect((await app.inject('/api/stores')).json()).toHaveLength(5);
  });

  it('parse + validation', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/parse', payload: { text: LIST } });
    expect(r.json().items).toHaveLength(5);
    expect((await app.inject({ method: 'POST', url: '/api/parse', payload: {} })).statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/api/quotes', payload: {} })).statusCode).toBe(400);
  });

  it('quote returns labelled sample plans with a recommendation', async () => {
    const q = await quote();
    expect(q.sample).toBe(true);
    expect(q.quotes).toHaveLength(5);
    expect(q.plans.map((p: { id: string }) => p.id)).toContain(q.recommended);
    expect((await app.inject(`/api/quotes/${q.id}`)).json().id).toBe(q.id);
  });

  it('checkout: fill → ready to pay → no "paid" without handoff → handoff → user confirms → order', async () => {
    const q = await quote();
    const c0 = (await app.inject({ method: 'POST', url: '/api/checkouts', payload: { quoteId: q.id, planId: q.recommended } })).json();
    const c = await waitCheckout(c0.id);
    expect(c.status).toBe('ready_to_pay');
    const store = c.carts[0].store;
    const n = (await app.inject('/api/notifications')).json();
    expect(n.some((x: { kind: string; title: string }) => x.kind === 'ready_to_pay' && /confirm & pay/.test(x.title))).toBe(true);

    const early = await app.inject({ method: 'POST', url: `/api/checkouts/${c.id}/carts/${store}/paid`, payload: { userConfirmed: true } });
    expect(early.statusCode).toBe(409);
    const noFlag = await app.inject({ method: 'POST', url: `/api/checkouts/${c.id}/carts/${store}/paid`, payload: {} });
    expect(noFlag.statusCode).toBe(400);

    const h = (await app.inject({ method: 'POST', url: `/api/checkouts/${c.id}/carts/${store}/handoff`, payload: {} })).json();
    expect(h.appUrl).toBeTruthy();
    expect(h.steps.join(' ')).toMatch(/yourself/);
    const o = await app.inject({ method: 'POST', url: `/api/checkouts/${c.id}/carts/${store}/paid`, payload: { userConfirmed: true } });
    expect(o.statusCode).toBe(201);
    const order = (await app.inject(`/api/orders/${o.json().id}`)).json();
    expect(order.stages).toHaveLength(5);
    expect(order.sample).toBe(true);
  });

  it('overrides are re-priced server-side and must be real substitutes', async () => {
    const q = await quote();
    const plan = q.plans.find((p: { id: string }) => p.id === q.recommended);
    const line = plan.parts[0].lines.find((l: { alternatives: unknown[] }) => l.alternatives.length);
    if (line) {
      const alt = line.alternatives[0];
      const r = await app.inject({ method: 'POST', url: '/api/checkouts', payload: { quoteId: q.id, planId: plan.id, overrides: [{ itemId: line.itemId, store: plan.parts[0].store, skuId: alt.sku.id, packs: 1 }] } });
      expect(r.statusCode, r.body).toBe(201);
      const l = r.json().carts.flatMap((x: { lines: { itemId: string; price: number; sku: { price: number } }[] }) => x.lines).find((x: { itemId: string }) => x.itemId === line.itemId);
      expect(l.price).toBe(l.sku.price);
    }
    const eggSku = plan.parts[0].lines.find((l: { sku: { itemKey: string } }) => l.sku.itemKey === 'eggs').sku;
    const atta = q.items.find((i: { key: string }) => i.key === 'atta');
    const bad = await app.inject({ method: 'POST', url: '/api/checkouts', payload: { quoteId: q.id, planId: plan.id, overrides: [{ itemId: atta.id, store: eggSku.store, skuId: eggSku.id, packs: 1 }] } });
    expect(bad.statusCode).toBe(400);
  });

  it('saved lists with schedule, run now, settings', async () => {
    const l = await app.inject({ method: 'POST', url: '/api/lists', payload: { name: 'Weekly staples', text: LIST, budget: 800, schedule: { enabled: true, days: [6], time: '09:00', strategy: 'cheapest', autoFill: false } } });
    expect(l.statusCode).toBe(201);
    expect(l.json().nextRunAt).toBeGreaterThan(Date.now());
    const run = (await app.inject({ method: 'POST', url: `/api/lists/${l.json().id}/run`, payload: {} })).json();
    expect(run.plans).toBeGreaterThan(0);
    expect(run.checkoutId).toBeUndefined();
    const s = (await app.inject({ method: 'PATCH', url: '/api/settings', payload: { pincode: '400001', budget: 1500 } })).json();
    expect(s).toMatchObject({ pincode: '400001', budget: 1500 });
    expect((await app.inject({ method: 'PATCH', url: '/api/settings', payload: { pincode: '12' } })).statusCode).toBe(400);
    expect((await app.inject({ method: 'DELETE', url: `/api/lists/${l.json().id}` })).statusCode).toBe(204);
  });

  it('CORS preflight allows PATCH/DELETE; OpenAPI is served', async () => {
    const r = await app.inject({ method: 'OPTIONS', url: '/api/lists/x', headers: { origin: 'http://localhost:5175', 'access-control-request-method': 'DELETE', 'access-control-request-headers': 'content-type,x-user-id' } });
    expect(r.statusCode).toBe(204);
    expect(r.headers['access-control-allow-methods']).toMatch(/DELETE/);
    const spec = (await app.inject('/docs/json')).json();
    expect(Object.keys(spec.paths).length).toBeGreaterThan(15);
  });
});
