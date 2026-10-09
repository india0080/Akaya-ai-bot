import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { setup } from './helpers.js';

const H = { authorization: 'Bearer test-token', 'x-user-id': 'u1' };

function app() {
  const s = setup();
  return { ...s, app: buildApp({ scheduler: s.scheduler, store: s.store, apiToken: 'test-token' }) };
}

describe('HTTP API', () => {
  let close: (() => Promise<void>) | null = null;
  afterEach(async () => close?.());

  it('requires auth', async () => {
    const { app: a, queue } = app();
    close = async () => void (await queue.close());
    const r = await a.inject({ method: 'GET', url: '/v1/messages' });
    expect(r.statusCode).toBe(401);
  });

  it('lists channels with honest auto levels', async () => {
    const { app: a } = app();
    const r = await a.inject({ method: 'GET', url: '/v1/channels' });
    const chans = r.json() as { id: string; auto: string }[];
    expect(chans.find((c) => c.id === 'whatsapp')?.auto).toBe('tap');
    expect(chans.find((c) => c.id === 'gmail')?.auto).toBe('api');
    expect(chans).toHaveLength(20);
  });

  it('creates, reads, lists, edits and cancels', async () => {
    const { app: a, queue } = app();
    close = async () => void (await queue.close());
    const sendAt = new Date(Date.now() + 3_600_000).toISOString();
    const c = await a.inject({ method: 'POST', url: '/v1/messages', headers: H, payload: { channels: ['gmail'], to: 'Rahul', text: 'Invoice reminder', sendAt, timezone: 'Asia/Kolkata' } });
    expect(c.statusCode).toBe(201);
    const id = c.json().id as string;
    expect((await a.inject({ method: 'GET', url: `/v1/messages/${id}`, headers: H })).json().status).toBe('scheduled');
    expect((await a.inject({ method: 'GET', url: '/v1/messages', headers: H })).json()).toHaveLength(1);
    const p = await a.inject({ method: 'PATCH', url: `/v1/messages/${id}`, headers: H, payload: { text: 'Updated text' } });
    expect(p.json().text).toBe('Updated text');
    const d = await a.inject({ method: 'DELETE', url: `/v1/messages/${id}`, headers: H });
    expect(d.json().status).toBe('cancelled');
    // other users cannot see it
    expect((await a.inject({ method: 'GET', url: `/v1/messages/${id}`, headers: { ...H, 'x-user-id': 'u2' } })).statusCode).toBe(404);
  });

  it('returns 422 with channel rule issues and 400 for bad input', async () => {
    const { app: a, queue } = app();
    close = async () => void (await queue.close());
    const r = await a.inject({
      method: 'POST',
      url: '/v1/messages',
      headers: H,
      payload: { channels: ['tiktok'], to: 'me', text: 'hi', sendAt: Date.now() + 60_000 },
    });
    expect(r.statusCode).toBe(422);
    expect(r.json().issues).toContain('TikTok: a video is required');
    const bad = await a.inject({ method: 'POST', url: '/v1/messages', headers: H, payload: { channels: ['carrier-pigeon'], to: 'x', sendAt: 1 } });
    expect(bad.statusCode).toBe(400);
    const tz = await a.inject({ method: 'POST', url: '/v1/messages', headers: H, payload: { channels: ['gmail'], to: 'x', text: 'y', sendAt: Date.now() + 60_000, timezone: 'Mars/Olympus' } });
    expect(tz.statusCode).toBe(400);
  });

  it('serves the OpenAPI document', async () => {
    const { app: a } = app();
    const r = await a.inject({ method: 'GET', url: '/openapi.yaml' });
    expect(r.statusCode).toBe(200);
    expect(r.body).toContain('openapi: 3.1.0');
  });
});
