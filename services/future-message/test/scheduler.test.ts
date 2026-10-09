import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BACKOFF_MS, ValidationError } from '../src/scheduler.js';
import type { SenderAdapter } from '../src/adapters/types.js';
import { setup } from './helpers.js';

const IN_1_MIN = () => Date.now() + 60_000;
const flush = () => vi.advanceTimersByTimeAsync(0);

describe('Scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-09T13:52:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('sends at the scheduled time (not before)', async () => {
    const { scheduler, store } = setup();
    const m = await scheduler.schedule('u1', { channels: ['gmail', 'telegram'], to: 'Priya', text: 'Hi Priya', sendAt: IN_1_MIN(), timezone: 'Asia/Kolkata', repeat: 'once' });
    expect(m.status).toBe('scheduled');
    await vi.advanceTimersByTimeAsync(59_000);
    expect((await store.get(m.id))!.status).toBe('scheduled');
    await vi.advanceTimersByTimeAsync(1_000);
    await flush();
    const done = (await store.get(m.id))!;
    expect(done.status).toBe('sent');
    expect(done.results.gmail?.status).toBe('sent');
    expect(done.results.telegram?.status).toBe('sent');
  });

  it('personal WhatsApp becomes a one-tap reminder push', async () => {
    const { scheduler, store, pushes } = setup();
    const m = await scheduler.schedule('u1', { channels: ['whatsapp'], to: 'Neha', targets: { whatsapp: '+91 98200 00003' }, text: 'Happy birthday!', sendAt: IN_1_MIN(), timezone: 'Asia/Kolkata', repeat: 'once' });
    await vi.advanceTimersByTimeAsync(60_000);
    expect((await store.get(m.id))!.status).toBe('needs-tap');
    expect(pushes[0].deeplink).toBe('https://wa.me/919820000003?text=Happy%20birthday!');
  });

  it('retries retryable failures with backoff, then succeeds', async () => {
    const { scheduler, store } = setup();
    const m = await scheduler.schedule('u1', { channels: ['slack'], to: '#launch', text: 'Standup #fail', sendAt: IN_1_MIN(), timezone: 'UTC', repeat: 'once' });
    await vi.advanceTimersByTimeAsync(60_000);
    let cur = (await store.get(m.id))!;
    expect(cur.status).toBe('scheduled');
    expect(cur.results.slack).toMatchObject({ status: 'pending', attempts: 1 });
    await vi.advanceTimersByTimeAsync(BACKOFF_MS[0]);
    cur = (await store.get(m.id))!;
    expect(cur.status).toBe('sent');
    expect(cur.results.slack?.attempts).toBe(2);
  });

  it('gives up after 3 attempts and supports manual retry', async () => {
    let calls = 0;
    const flaky: SenderAdapter = { channel: 'x', requires: [], send: async () => (++calls <= 3 ? { ok: false, retryable: true, error: '503' } : { ok: true, externalId: 't1' }) };
    const { scheduler, store } = setup({ x: flaky });
    const m = await scheduler.schedule('u1', { channels: ['x'], to: 'me', text: 'post', sendAt: IN_1_MIN(), timezone: 'UTC', repeat: 'once' });
    await vi.advanceTimersByTimeAsync(60_000 + BACKOFF_MS[0] + BACKOFF_MS[1] + 1000);
    expect((await store.get(m.id))!.status).toBe('failed');
    expect(calls).toBe(3);
    await scheduler.retry('u1', m.id);
    await flush();
    expect((await store.get(m.id))!.status).toBe('sent');
  });

  it('non-retryable error fails immediately; other channels still send (partial)', async () => {
    const bad: SenderAdapter = { channel: 'linkedin', requires: [], send: async () => ({ ok: false, retryable: false, error: '401 token expired' }) };
    const { scheduler, store } = setup({ linkedin: bad });
    const m = await scheduler.schedule('u1', { channels: ['linkedin', 'x'], to: 'me', text: 'launch', sendAt: IN_1_MIN(), timezone: 'UTC', repeat: 'once' });
    await vi.advanceTimersByTimeAsync(60_000);
    const cur = (await store.get(m.id))!;
    expect(cur.status).toBe('partial');
    expect(cur.results.linkedin).toMatchObject({ status: 'failed', error: '401 token expired' });
    expect(cur.results.x?.status).toBe('sent');
  });

  it('yearly birthday message re-queues next year at the same IST time', async () => {
    const { scheduler, store } = setup();
    const sendAt = Date.parse('2026-10-09T18:30:00Z'); // 10 Oct 00:00 IST
    const m = await scheduler.schedule('u1', { channels: ['telegram'], to: 'Neha', text: 'Happy birthday 🎉', sendAt, timezone: 'Asia/Kolkata', repeat: 'yearly' });
    await vi.advanceTimersByTimeAsync(sendAt - Date.now());
    const all = await store.list('u1');
    const next = all.find((x) => x.id !== m.id)!;
    expect(next.repeatOf).toBe(m.id);
    expect(new Date(next.sendAt).toISOString()).toBe('2027-10-09T18:30:00.000Z');
    expect(next.status).toBe('scheduled');
  });

  it('cancel removes the job', async () => {
    const { scheduler, store, queue } = setup();
    const m = await scheduler.schedule('u1', { channels: ['gmail'], to: 'Rahul', text: 'x', sendAt: IN_1_MIN(), timezone: 'UTC', repeat: 'once' });
    await scheduler.cancel('u1', m.id);
    expect(queue.size()).toBe(0);
    await vi.advanceTimersByTimeAsync(120_000);
    expect((await store.get(m.id))!.status).toBe('cancelled');
  });

  it('Slack is handed to chat.scheduleMessage at schedule time', async () => {
    const native: SenderAdapter = {
      channel: 'slack',
      requires: [],
      scheduleNative: async () => ({ ok: true, externalId: 'Q123' }),
      cancelNative: vi.fn(async () => {}),
      send: vi.fn(async () => ({ ok: true as const })),
    };
    const { scheduler, store } = setup({ slack: native });
    const m = await scheduler.schedule('u1', { channels: ['slack'], to: '#team', text: 'hello', sendAt: Date.now() + 3_600_000, timezone: 'UTC', repeat: 'once' });
    expect(m.results.slack).toMatchObject({ status: 'scheduled-native', externalId: 'Q123' });
    await vi.advanceTimersByTimeAsync(3_600_000);
    expect((await store.get(m.id))!.status).toBe('sent');
    expect(native.send).not.toHaveBeenCalled();
  });

  it('validates channel rules', async () => {
    const { scheduler } = setup();
    await expect(
      scheduler.schedule('u1', { channels: ['instagram', 'x'], to: 'me', text: 'x'.repeat(300), sendAt: IN_1_MIN(), timezone: 'UTC', repeat: 'once' }),
    ).rejects.toThrowError(ValidationError);
    try {
      await scheduler.schedule('u1', { channels: ['youtube'], to: 'me', text: 'hi', sendAt: Date.now() - 1, timezone: 'UTC', repeat: 'once' });
    } catch (e) {
      expect((e as ValidationError).issues).toEqual(['sendAt: must be in the future', 'YouTube / Shorts: a video is required']);
    }
  });
});
