import { describe, expect, it } from 'vitest';
import { gmail, outlook, slack, telegram, whatsappCloud } from '../src/adapters/chat.js';
import { facebook, instagram, linkedin, tiktok, x, youtube } from '../src/adapters/social.js';
import type { SendContext } from '../src/adapters/types.js';
import type { ScheduledMessage } from '../src/types.js';
import { fakeFetch } from './helpers.js';

const base: ScheduledMessage = {
  id: 'm1',
  userId: 'u1',
  channels: [],
  to: 'Priya',
  text: 'Hello from Akaya',
  sendAt: Date.parse('2026-10-10T03:30:00Z'),
  timezone: 'Asia/Kolkata',
  repeat: 'once',
  status: 'scheduled',
  results: {},
  createdAt: 0,
  updatedAt: 0,
};
const ctx = (fn: typeof fetch, creds: Record<string, string>): SendContext => ({ fetch: fn, creds, now: () => Date.parse('2026-10-09T14:00:00Z'), sleep: async () => {} });

describe('real adapters build the right API requests', () => {
  it('WhatsApp Cloud uses a template outside the 24h window', async () => {
    const f = fakeFetch([{ body: { messages: [{ id: 'wamid.1' }] } }]);
    const out = await whatsappCloud.send({ ...base, targets: { 'whatsapp-business': '+91 98200 00001' } }, ctx(f.fn, { WHATSAPP_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: '123' }));
    expect(out).toEqual({ ok: true, externalId: 'wamid.1' });
    expect(f.calls[0].url).toBe('https://graph.facebook.com/v21.0/123/messages');
    expect(f.calls[0].headers.Authorization).toBe('Bearer t');
    expect(f.calls[0].body).toMatchObject({ messaging_product: 'whatsapp', to: '919820000001', type: 'template', template: { name: 'akaya_scheduled_message' } });
  });
  it('WhatsApp Cloud sends free text inside the window', async () => {
    const f = fakeFetch([{ body: { messages: [{ id: 'wamid.2' }] } }]);
    await whatsappCloud.send(base, ctx(f.fn, { WHATSAPP_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: '123', windowOpen: '1' }));
    expect(f.calls[0].body).toMatchObject({ type: 'text', text: { body: 'Hello from Akaya' } });
  });
  it('Telegram sendPhoto with caption', async () => {
    const f = fakeFetch([{ body: { ok: true, result: { message_id: 7 } } }]);
    const out = await telegram.send({ ...base, targets: { telegram: '42' }, media: { kind: 'image', url: 'https://cdn.example.com/a.jpg' } }, ctx(f.fn, { TELEGRAM_BOT_TOKEN: 'abc' }));
    expect(out).toEqual({ ok: true, externalId: '7' });
    expect(f.calls[0].url).toBe('https://api.telegram.org/botabc/sendPhoto');
    expect(f.calls[0].body).toEqual({ chat_id: '42', photo: 'https://cdn.example.com/a.jpg', caption: 'Hello from Akaya' });
  });
  it('Gmail sends base64url RFC 2822', async () => {
    const f = fakeFetch([{ body: { id: 'g1' } }]);
    await gmail.send({ ...base, subject: 'Invoice', targets: { gmail: 'rahul@example.com' } }, ctx(f.fn, { GMAIL_ACCESS_TOKEN: 'ya29' }));
    const raw = (f.calls[0].body as { raw: string }).raw;
    const decoded = Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    expect(decoded).toContain('To: rahul@example.com');
    expect(decoded).toContain('Hello from Akaya');
    expect(raw).not.toMatch(/[+/=]/);
  });
  it('Outlook sendMail payload', async () => {
    const f = fakeFetch([{ status: 202, body: '' }]);
    const out = await outlook.send({ ...base, targets: { outlook: 'a@x.com; b@x.com' } }, ctx(f.fn, { MS_GRAPH_ACCESS_TOKEN: 'eyJ' }));
    expect(out.ok).toBe(true);
    expect(f.calls[0].body).toMatchObject({ message: { toRecipients: [{ emailAddress: { address: 'a@x.com' } }, { emailAddress: { address: 'b@x.com' } }] }, saveToSentItems: true });
  });
  it('Slack native schedule uses post_at seconds', async () => {
    const f = fakeFetch([{ body: { ok: true, scheduled_message_id: 'Q1' } }]);
    const out = await slack.scheduleNative!({ ...base, targets: { slack: 'C123' } }, ctx(f.fn, { SLACK_BOT_TOKEN: 'xoxb' }));
    expect(out).toEqual({ ok: true, externalId: 'Q1' });
    expect(f.calls[0].body).toEqual({ channel: 'C123', text: 'Hello from Akaya', post_at: base.sendAt / 1000 });
  });
  it('Slack API errors map to retryable only for rate limits', async () => {
    const f = fakeFetch([{ body: { ok: false, error: 'not_in_channel' } }, { body: { ok: false, error: 'ratelimited' } }]);
    const a = await slack.send(base, ctx(f.fn, { SLACK_BOT_TOKEN: 'xoxb' }));
    const b = await slack.send(base, ctx(f.fn, { SLACK_BOT_TOKEN: 'xoxb' }));
    expect(a).toMatchObject({ ok: false, retryable: false });
    expect(b).toMatchObject({ ok: false, retryable: true });
  });
  it('Instagram: container then publish', async () => {
    const f = fakeFetch([{ body: { id: 'c1' } }, { body: { id: 'p1' } }]);
    const out = await instagram.send({ ...base, media: { kind: 'image', url: 'https://cdn.example.com/a.jpg' } }, ctx(f.fn, { META_PAGE_ACCESS_TOKEN: 't', META_IG_USER_ID: '17841' }));
    expect(out).toEqual({ ok: true, externalId: 'p1' });
    expect(f.calls.map((c) => c.url)).toEqual(['https://graph.facebook.com/v21.0/17841/media', 'https://graph.facebook.com/v21.0/17841/media_publish']);
    expect(f.calls[1].body).toEqual({ creation_id: 'c1' });
  });
  it('Instagram video waits for FINISHED', async () => {
    const f = fakeFetch([{ body: { id: 'c2' } }, { body: { status_code: 'IN_PROGRESS' } }, { body: { status_code: 'FINISHED' } }, { body: { id: 'p2' } }]);
    const out = await instagram.send({ ...base, media: { kind: 'video', url: 'https://cdn.example.com/v.mp4' } }, ctx(f.fn, { META_PAGE_ACCESS_TOKEN: 't', META_IG_USER_ID: '1' }));
    expect(out).toEqual({ ok: true, externalId: 'p2' });
    expect(f.calls[0].body).toMatchObject({ media_type: 'REELS' });
  });
  it('Facebook Page photo post', async () => {
    const f = fakeFetch([{ body: { id: 'ph', post_id: 'pg_1' } }]);
    const out = await facebook.send({ ...base, media: { kind: 'image', url: 'https://cdn.example.com/a.jpg' } }, ctx(f.fn, { META_PAGE_ACCESS_TOKEN: 't', META_PAGE_ID: 'pg' }));
    expect(out).toEqual({ ok: true, externalId: 'pg_1' });
    expect(f.calls[0].url).toBe('https://graph.facebook.com/v21.0/pg/photos');
  });
  it('X text post', async () => {
    const f = fakeFetch([{ status: 201, body: { data: { id: '1845' } } }]);
    const out = await x.send(base, ctx(f.fn, { X_ACCESS_TOKEN: 'x' }));
    expect(out).toEqual({ ok: true, externalId: '1845' });
    expect(f.calls[0]).toMatchObject({ url: 'https://api.x.com/2/tweets', body: { text: 'Hello from Akaya' } });
  });
  it('LinkedIn post with versioned headers', async () => {
    const f = fakeFetch([{ status: 201, body: '', headers: { 'x-restli-id': 'urn:li:share:9' } }]);
    const out = await linkedin.send(base, ctx(f.fn, { LINKEDIN_ACCESS_TOKEN: 'li', LINKEDIN_AUTHOR_URN: 'urn:li:person:abc' }));
    expect(out).toEqual({ ok: true, externalId: 'urn:li:share:9' });
    expect(f.calls[0].headers['LinkedIn-Version']).toMatch(/^\d{6}$/);
    expect(f.calls[0].body).toMatchObject({ author: 'urn:li:person:abc', commentary: 'Hello from Akaya', lifecycleState: 'PUBLISHED' });
  });
  it('YouTube resumable upload', async () => {
    const f = fakeFetch([
      { status: 200, body: '', headers: { location: 'https://upload.example/session1' } },
      { status: 200, body: 'VIDEOBYTES', headers: { 'content-type': 'video/mp4' } },
      { status: 200, body: { id: 'yt1' } },
    ]);
    const out = await youtube.send({ ...base, text: 'My Short\nBehind the scenes', media: { kind: 'video', url: 'https://cdn.example.com/v.mp4' } }, ctx(f.fn, { YOUTUBE_ACCESS_TOKEN: 'ya' }));
    expect(out).toEqual({ ok: true, externalId: 'yt1' });
    expect(f.calls[0].body).toMatchObject({ snippet: { title: 'My Short', description: 'Behind the scenes' } });
    expect(f.calls[2]).toMatchObject({ url: 'https://upload.example/session1', method: 'PUT' });
  });
  it('TikTok direct post defaults to SELF_ONLY', async () => {
    const f = fakeFetch([{ body: { data: { publish_id: 'v_pub_1' }, error: { code: 'ok', message: '' } } }]);
    const out = await tiktok.send({ ...base, media: { kind: 'video', url: 'https://cdn.example.com/v.mp4' } }, ctx(f.fn, { TIKTOK_ACCESS_TOKEN: 'act' }));
    expect(out).toEqual({ ok: true, externalId: 'v_pub_1' });
    expect(f.calls[0].body).toMatchObject({ post_info: { privacy_level: 'SELF_ONLY' }, source_info: { source: 'PULL_FROM_URL' } });
  });
  it('missing credentials → not connected, not retryable', async () => {
    const f = fakeFetch([]);
    expect(await gmail.send(base, ctx(f.fn, {}))).toMatchObject({ ok: false, retryable: false, code: 'not_connected' });
    expect(f.calls).toHaveLength(0);
  });
  it('HTTP 429 / 5xx are retryable, 400 is not', async () => {
    const f = fakeFetch([{ status: 429, body: {} }, { status: 400, body: { error: 'bad' } }]);
    expect(await x.send(base, ctx(f.fn, { X_ACCESS_TOKEN: 'x' }))).toMatchObject({ ok: false, retryable: true });
    expect(await x.send(base, ctx(f.fn, { X_ACCESS_TOKEN: 'x' }))).toMatchObject({ ok: false, retryable: false });
  });
});
