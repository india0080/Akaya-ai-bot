import type { ChannelId, ScheduledMessage, SendOutcome } from '../types.js';

export type Fetch = typeof fetch;

export interface SendContext {
  /** credentials for this user + channel (OAuth access token, page id, bot token…) */
  creds: Record<string, string>;
  fetch: Fetch;
  now: () => number;
  /** used for polling (e.g. Instagram video containers); injectable for tests */
  sleep: (ms: number) => Promise<void>;
}

export interface SenderAdapter {
  channel: ChannelId;
  /** credential keys this adapter needs */
  requires: string[];
  send(msg: ScheduledMessage, ctx: SendContext): Promise<SendOutcome>;
  /** optional: hand the message to the platform's own scheduler at schedule time (e.g. Slack) */
  scheduleNative?(msg: ScheduledMessage, ctx: SendContext): Promise<SendOutcome>;
  cancelNative?(msg: ScheduledMessage, externalId: string, ctx: SendContext): Promise<void>;
}

export const target = (msg: ScheduledMessage, ch: ChannelId) => msg.targets?.[ch] ?? msg.to;
