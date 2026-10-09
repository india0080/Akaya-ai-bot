/** Chat & email adapters: WhatsApp Cloud API, Telegram Bot API, Gmail API, Microsoft Graph (mail + Teams), Slack, Messenger, Instagram DM, Discord. */
import type { SenderAdapter } from './types.js';
import { target } from './types.js';
import { b64url, callJson, httpFailure, missing } from './http.js';

const GRAPH = 'https://graph.facebook.com/v21.0';

/**
 * WhatsApp Cloud API. Inside the 24-hour customer-service window a free-form text is allowed;
 * outside it (the normal case for scheduled messages) an approved template must be used.
 * targets['whatsapp-business'] = recipient phone in E.164 without "+".
 * Set creds.windowOpen = "1" only when the conversation window is known to be open.
 */
export const whatsappCloud: SenderAdapter = {
  channel: 'whatsapp-business',
  requires: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const to = target(msg, 'whatsapp-business').replace(/[^\d]/g, '');
    const inWindow = ctx.creds.windowOpen === '1';
    const body = inWindow
      ? msg.media
        ? { messaging_product: 'whatsapp', to, type: msg.media.kind, [msg.media.kind]: { link: msg.media.url, caption: msg.text } }
        : { messaging_product: 'whatsapp', to, type: 'text', text: { body: msg.text, preview_url: true } }
      : {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: ctx.creds.WHATSAPP_TEMPLATE || 'akaya_scheduled_message',
            language: { code: ctx.creds.WHATSAPP_TEMPLATE_LANG || 'en' },
            components: [{ type: 'body', parameters: [{ type: 'text', text: msg.text.slice(0, 1024) }] }],
          },
        };
    const r = await callJson<{ messages?: { id: string }[] }>(ctx.fetch, `${GRAPH}/${ctx.creds.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      token: ctx.creds.WHATSAPP_TOKEN,
      body,
    });
    return r.ok ? { ok: true, externalId: r.data.messages?.[0]?.id } : httpFailure(r, 'WhatsApp');
  },
};

/** Telegram Bot API: the bot can only message chats that started it. targets.telegram = chat_id */
export const telegram: SenderAdapter = {
  channel: 'telegram',
  requires: ['TELEGRAM_BOT_TOKEN'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const base = `https://api.telegram.org/bot${ctx.creds.TELEGRAM_BOT_TOKEN}`;
    const chat_id = target(msg, 'telegram');
    const [method, body] = msg.media
      ? msg.media.kind === 'video'
        ? ['sendVideo', { chat_id, video: msg.media.url, caption: msg.text.slice(0, 1024) }]
        : ['sendPhoto', { chat_id, photo: msg.media.url, caption: msg.text.slice(0, 1024) }]
      : ['sendMessage', { chat_id, text: msg.text }];
    const r = await callJson<{ ok: boolean; result?: { message_id: number }; description?: string }>(ctx.fetch, `${base}/${method}`, { body });
    if (r.ok && r.data.ok) return { ok: true, externalId: String(r.data.result?.message_id ?? '') };
    return httpFailure(r, 'Telegram');
  },
};

function mime(msg: { to: string; subject?: string; text: string }, to: string) {
  const subject = `=?UTF-8?B?${Buffer.from(msg.subject || 'Message from Akaya', 'utf8').toString('base64')}?=`;
  return [`To: ${to}`, `Subject: ${subject}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: 8bit', '', msg.text].join('\r\n');
}

/** Gmail API users.messages.send with an RFC 2822 message (scope gmail.send). targets.gmail = email */
export const gmail: SenderAdapter = {
  channel: 'gmail',
  requires: ['GMAIL_ACCESS_TOKEN'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const raw = b64url(mime(msg, target(msg, 'gmail')));
    const r = await callJson<{ id?: string }>(ctx.fetch, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      token: ctx.creds.GMAIL_ACCESS_TOKEN,
      body: { raw },
    });
    return r.ok ? { ok: true, externalId: r.data.id } : httpFailure(r, 'Gmail');
  },
};

/** Microsoft Graph POST /me/sendMail (Mail.Send). Returns 202 with no body. targets.outlook = email */
export const outlook: SenderAdapter = {
  channel: 'outlook',
  requires: ['MS_GRAPH_ACCESS_TOKEN'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const r = await callJson(ctx.fetch, 'https://graph.microsoft.com/v1.0/me/sendMail', {
      token: ctx.creds.MS_GRAPH_ACCESS_TOKEN,
      body: {
        message: {
          subject: msg.subject || 'Message from Akaya',
          body: { contentType: 'Text', content: msg.text },
          toRecipients: target(msg, 'outlook')
            .split(/[,;]\s*/)
            .map((address) => ({ emailAddress: { address } })),
        },
        saveToSentItems: true,
      },
    });
    return r.ok ? { ok: true } : httpFailure(r, 'Outlook');
  },
};

/** Microsoft Graph POST /chats/{id}/messages (ChatMessage.Send). targets.teams = chat id */
export const teams: SenderAdapter = {
  channel: 'teams',
  requires: ['MS_GRAPH_ACCESS_TOKEN'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const r = await callJson<{ id?: string }>(ctx.fetch, `https://graph.microsoft.com/v1.0/chats/${encodeURIComponent(target(msg, 'teams'))}/messages`, {
      token: ctx.creds.MS_GRAPH_ACCESS_TOKEN,
      body: { body: { contentType: 'text', content: msg.text } },
    });
    return r.ok ? { ok: true, externalId: r.data.id } : httpFailure(r, 'Teams');
  },
};

type SlackResp = { ok: boolean; error?: string; scheduled_message_id?: string; ts?: string };
const slackFail = (label: string, d: SlackResp) => ({
  ok: false as const,
  retryable: d.error === 'ratelimited' || d.error === 'internal_error',
  error: `${label}: ${d.error ?? 'unknown_error'}`,
  code: d.error,
});

/**
 * Slack: at schedule time we hand the message to chat.scheduleMessage (Slack holds it, up to 120 days);
 * if that isn't possible the due-time path uses chat.postMessage. targets.slack = channel id (C… / D…)
 */
export const slack: SenderAdapter = {
  channel: 'slack',
  requires: ['SLACK_BOT_TOKEN'],
  async scheduleNative(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const postAt = Math.floor(msg.sendAt / 1000);
    const lead = msg.sendAt - ctx.now();
    if (lead < 60_000 || lead > 120 * 86400_000) return { ok: false, retryable: false, error: 'outside Slack scheduling window', code: 'window' };
    const r = await callJson<SlackResp>(ctx.fetch, 'https://slack.com/api/chat.scheduleMessage', {
      token: ctx.creds.SLACK_BOT_TOKEN,
      body: { channel: target(msg, 'slack'), text: msg.text, post_at: postAt },
    });
    if (!r.ok) return httpFailure(r, 'Slack');
    return r.data.ok ? { ok: true, externalId: r.data.scheduled_message_id } : slackFail('Slack', r.data);
  },
  async cancelNative(msg, externalId, ctx) {
    await callJson(ctx.fetch, 'https://slack.com/api/chat.deleteScheduledMessage', {
      token: ctx.creds.SLACK_BOT_TOKEN,
      body: { channel: target(msg, 'slack'), scheduled_message_id: externalId },
    });
  },
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const r = await callJson<SlackResp>(ctx.fetch, 'https://slack.com/api/chat.postMessage', {
      token: ctx.creds.SLACK_BOT_TOKEN,
      body: { channel: target(msg, 'slack'), text: msg.text },
    });
    if (!r.ok) return httpFailure(r, 'Slack');
    return r.data.ok ? { ok: true, externalId: r.data.ts } : slackFail('Slack', r.data);
  },
};

/** Messenger Send API from a Page (targets.messenger = PSID). Standard messaging window applies. */
export const messenger: SenderAdapter = {
  channel: 'messenger',
  requires: ['META_PAGE_ACCESS_TOKEN', 'META_PAGE_ID'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const r = await callJson<{ message_id?: string }>(ctx.fetch, `${GRAPH}/${ctx.creds.META_PAGE_ID}/messages`, {
      token: ctx.creds.META_PAGE_ACCESS_TOKEN,
      body: { recipient: { id: target(msg, 'messenger') }, messaging_type: 'RESPONSE', message: { text: msg.text } },
    });
    return r.ok ? { ok: true, externalId: r.data.message_id } : httpFailure(r, 'Messenger');
  },
};

/** Instagram Messaging (professional accounts, 24 h window). targets['instagram-dm'] = IGSID */
export const instagramDm: SenderAdapter = {
  channel: 'instagram-dm',
  requires: ['META_PAGE_ACCESS_TOKEN', 'META_IG_USER_ID'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const r = await callJson<{ message_id?: string }>(ctx.fetch, `${GRAPH}/${ctx.creds.META_IG_USER_ID}/messages`, {
      token: ctx.creds.META_PAGE_ACCESS_TOKEN,
      body: { recipient: { id: target(msg, 'instagram-dm') }, message: { text: msg.text } },
    });
    return r.ok ? { ok: true, externalId: r.data.message_id } : httpFailure(r, 'Instagram DM');
  },
};

/** Discord channel webhook (bots/webhooks cannot DM people on a user's behalf). */
export const discord: SenderAdapter = {
  channel: 'discord',
  requires: ['DISCORD_WEBHOOK_URL'],
  async send(msg, ctx) {
    const m = missing(this.requires, ctx.creds);
    if (m) return m;
    const content = msg.media ? `${msg.text}\n${msg.media.url}` : msg.text;
    const r = await callJson<{ id?: string }>(ctx.fetch, `${ctx.creds.DISCORD_WEBHOOK_URL}?wait=true`, { body: { content: content.slice(0, 2000) } });
    return r.ok ? { ok: true, externalId: r.data.id } : httpFailure(r, 'Discord');
  },
};
