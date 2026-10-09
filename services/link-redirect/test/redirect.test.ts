import { describe, expect, it } from 'vitest';
import { auth, makeApp } from './helpers.js';

describe('short links', () => {
  it('POST /links builds a tracked target; GET /go/:id logs the click and 302s', async () => {
    const { app, store } = makeApp();
    const res = await app.inject({
      method: 'POST',
      url: '/links',
      headers: auth,
      payload: {
        platform: 'booking',
        intent: 'hotel',
        params: { city: 'Goa', checkin: '2026-12-20', checkout: '2026-12-22' },
        campaign: 'travel',
      },
    });
    expect(res.statusCode).toBe(201);
    const link = res.json();
    expect(link.id).toMatch(/^[0-9A-Za-z]{7}$/);
    expect(link.shortUrl).toBe(`https://go.akaya.one/go/${link.id}`);
    expect(link.affiliate).toEqual({ active: true, via: 'param:aid' });
    const target = new URL(link.targetUrl);
    expect(target.host).toBe('www.booking.com');
    expect(target.searchParams.get('aid')).toBe('1234567');
    expect(target.searchParams.get('utm_source')).toBe('akaya');
    expect(target.searchParams.get('utm_campaign')).toBe('travel');

    const go = await app.inject({
      method: 'GET',
      url: `/go/${link.id}`,
      headers: { 'x-akaya-anon': 'install-abc12345' },
    });
    expect(go.statusCode).toBe(302);
    expect(go.headers.location).toBe(link.targetUrl);
    expect(go.headers['cache-control']).toBe('no-store');
    const click = store.data.clicks[0];
    expect(click).toMatchObject({
      linkId: link.id,
      platform: 'booking',
      campaign: 'travel',
      ts: Date.parse('2026-10-09T10:00:00+05:30'),
    });
    expect(click.anon).toMatch(/^[0-9a-f]{16}$/);
    expect(click.anon).not.toContain('install');
  });

  it('reuses the id for identical input', async () => {
    const { app } = makeApp();
    const body = { platform: 'amazon', intent: 'search', params: { q: 'boat headphones' }, campaign: 'chat' };
    const a = await app.inject({ method: 'POST', url: '/links', headers: auth, payload: body });
    const b = await app.inject({ method: 'POST', url: '/links', headers: auth, payload: body });
    expect(b.statusCode).toBe(200);
    expect(b.json().id).toBe(a.json().id);
    expect(new URL(a.json().targetUrl).searchParams.get('tag')).toBe('akaya-21');
  });

  it('never becomes an open redirect', async () => {
    const { app } = makeApp();
    const bad = await app.inject({
      method: 'POST',
      url: '/links',
      headers: auth,
      payload: { platform: 'amazon', intent: 'product', params: { url: 'https://evil.example/phish' } },
    });
    expect(bad.statusCode).toBe(422);
    const unknown = await app.inject({
      method: 'POST',
      url: '/links',
      headers: auth,
      payload: { platform: 'evil', intent: 'home' },
    });
    expect(unknown.statusCode).toBe(400);
    const msg = await app.inject({
      method: 'POST',
      url: '/links',
      headers: auth,
      payload: { platform: 'whatsapp', intent: 'message', params: { text: 'hi' } },
    });
    expect(msg.statusCode).toBe(400);
  });

  it('404 for unknown or malformed ids, without logging a click', async () => {
    const { app, store } = makeApp();
    for (const id of ['AAAAAAA', 'abc-def', 'x'.repeat(30)])
      expect((await app.inject({ method: 'GET', url: `/go/${id}` })).statusCode).toBe(404);
    expect(store.data.clicks).toHaveLength(0);
  });

  it('admin routes need the bearer token; /go and /healthz do not', async () => {
    const { app } = makeApp();
    expect(
      (await app.inject({ method: 'POST', url: '/links', payload: { platform: 'amazon', intent: 'home' } })).statusCode,
    ).toBe(401);
    expect(
      (await app.inject({ method: 'GET', url: '/reports', headers: { authorization: 'Bearer wrong' } })).statusCode,
    ).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/healthz' })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/openapi.yaml' })).body).toContain('openapi: 3.1.0');
  });

  it('config rejects weak secrets', async () => {
    const { loadConfig } = await import('../src/config.js');
    expect(() => loadConfig({ ADMIN_TOKEN: 'short', ANON_SALT: 'test-salt-0123456789' })).toThrow(/ADMIN_TOKEN/);
  });
});
