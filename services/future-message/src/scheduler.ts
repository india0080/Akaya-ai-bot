import { randomUUID } from 'node:crypto';
import { CHANNELS, validateForChannel } from './channels.js';
import { nextOccurrence } from './tz.js';
import type { SendContext, SenderAdapter } from './adapters/types.js';
import type { CredentialProvider } from './credentials.js';
import type { JobQueue } from './queue/types.js';
import type { MessageStore } from './store/types.js';
import type { ChannelId, ChannelResult, MessageStatus, ScheduledMessage } from './types.js';

export const MAX_ATTEMPTS = 3;
/** backoff before attempt 2, 3 */
export const BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000];

export type NewMessage = Pick<ScheduledMessage, 'channels' | 'to' | 'text' | 'sendAt' | 'timezone' | 'repeat'> &
  Partial<Pick<ScheduledMessage, 'targets' | 'subject' | 'media'>>;

export class ValidationError extends Error {
  constructor(public issues: string[]) {
    super(issues.join('; '));
  }
}

export interface Deps {
  store: MessageStore;
  queue: JobQueue;
  adapters: Record<ChannelId, SenderAdapter>;
  creds: CredentialProvider;
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  log?: (s: string) => void;
}

export function rollup(results: ScheduledMessage['results'], channels: ChannelId[]): MessageStatus {
  const st = channels.map((c) => results[c]?.status ?? 'pending');
  if (st.includes('pending')) return 'sending';
  const failed = st.filter((s) => s === 'failed').length;
  if (failed === st.length) return 'failed';
  if (failed) return 'partial';
  if (st.includes('needs-tap')) return 'needs-tap';
  return 'sent';
}

/** Core service: validate → store → queue; when due, fan out to channel adapters with retries and repeats. */
export class Scheduler {
  private now: () => number;
  constructor(private d: Deps) {
    this.now = d.now ?? Date.now;
  }

  private ctx(creds: Record<string, string>): SendContext {
    return { creds, fetch: this.d.fetch ?? fetch, now: this.now, sleep: this.d.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))) };
  }

  validate(m: NewMessage): string[] {
    const issues: string[] = [];
    if (!m.channels?.length) issues.push('channels: pick at least one channel');
    for (const c of m.channels ?? []) if (!CHANNELS[c]) issues.push(`channels: unknown channel "${c}"`);
    if (!m.text?.trim() && !m.media) issues.push('text: message is empty');
    if (!(m.sendAt > this.now())) issues.push('sendAt: must be in the future');
    for (const c of m.channels ?? []) if (CHANNELS[c]) issues.push(...validateForChannel(c, m.text ?? '', m.media));
    return issues;
  }

  async schedule(userId: string, input: NewMessage): Promise<ScheduledMessage> {
    const issues = this.validate(input);
    if (issues.length) throw new ValidationError(issues);
    const t = this.now();
    const msg: ScheduledMessage = {
      id: randomUUID(),
      userId,
      channels: [...new Set(input.channels)],
      to: input.to,
      targets: input.targets,
      subject: input.subject,
      text: input.text ?? '',
      media: input.media,
      sendAt: input.sendAt,
      timezone: input.timezone || 'Asia/Kolkata',
      repeat: input.repeat || 'once',
      status: 'scheduled',
      results: {},
      createdAt: t,
      updatedAt: t,
    };
    await this.handOffNative(msg);
    await this.d.store.put(msg);
    await this.d.queue.enqueue(msg.id, msg.sendAt);
    return msg;
  }

  /** channels that can hold the message themselves (Slack) get it now; the due-time job skips them */
  private async handOffNative(msg: ScheduledMessage) {
    for (const c of msg.channels) {
      const a = this.d.adapters[c];
      if (!a?.scheduleNative) continue;
      const out = await a.scheduleNative(msg, this.ctx(await this.d.creds.get(msg.userId, c))).catch(() => null);
      if (out?.ok) msg.results[c] = { status: 'scheduled-native', attempts: 0, externalId: out.externalId };
    }
  }

  private async releaseNative(msg: ScheduledMessage) {
    for (const c of msg.channels) {
      const r = msg.results[c];
      const a = this.d.adapters[c];
      if (r?.status === 'scheduled-native' && r.externalId && a?.cancelNative)
        await a.cancelNative(msg, r.externalId, this.ctx(await this.d.creds.get(msg.userId, c))).catch(() => {});
    }
  }

  async update(userId: string, id: string, patch: Partial<NewMessage>): Promise<ScheduledMessage> {
    const cur = await this.own(userId, id);
    if (!['scheduled', 'failed', 'partial'].includes(cur.status)) throw new ValidationError([`cannot edit a message that is ${cur.status}`]);
    const next = { ...cur, ...patch, results: {}, status: 'scheduled' as const, updatedAt: this.now() };
    const issues = this.validate(next);
    if (issues.length) throw new ValidationError(issues);
    await this.releaseNative(cur);
    await this.handOffNative(next);
    await this.d.store.put(next);
    await this.d.queue.enqueue(id, next.sendAt);
    return next;
  }

  async cancel(userId: string, id: string): Promise<ScheduledMessage> {
    const cur = await this.own(userId, id);
    await this.d.queue.remove(id);
    await this.releaseNative(cur);
    const next = { ...cur, status: 'cancelled' as const, updatedAt: this.now() };
    await this.d.store.put(next);
    return next;
  }

  /** run failed channels again now */
  async retry(userId: string, id: string): Promise<ScheduledMessage> {
    const cur = await this.own(userId, id);
    if (!['failed', 'partial'].includes(cur.status)) throw new ValidationError([`only failed messages can be retried (status: ${cur.status})`]);
    for (const c of cur.channels) if (cur.results[c]?.status === 'failed') cur.results[c] = { ...cur.results[c]!, status: 'pending', attempts: 0 };
    cur.status = 'scheduled';
    cur.updatedAt = this.now();
    await this.d.store.put(cur);
    await this.d.queue.enqueue(id, this.now());
    return cur;
  }

  async sendNow(userId: string, id: string): Promise<ScheduledMessage> {
    const cur = await this.own(userId, id);
    if (cur.status !== 'scheduled') throw new ValidationError([`message is ${cur.status}`]);
    await this.releaseNative(cur);
    for (const c of cur.channels) if (cur.results[c]?.status === 'scheduled-native') delete cur.results[c];
    cur.sendAt = this.now();
    await this.d.store.put(cur);
    await this.d.queue.enqueue(id, cur.sendAt);
    return cur;
  }

  private async own(userId: string, id: string) {
    const m = await this.d.store.get(id);
    if (!m || m.userId !== userId) throw new NotFound();
    return m;
  }

  /** queue handler: send to every channel still pending, then retry / repeat / finish */
  async process(id: string): Promise<void> {
    const msg = await this.d.store.get(id);
    if (!msg || msg.status === 'cancelled' || msg.status === 'sent') return;
    msg.status = 'sending';
    await this.d.store.put(msg);

    let retryable = false;
    for (const c of msg.channels) {
      const prev: ChannelResult = msg.results[c] ?? { status: 'pending', attempts: 0 };
      if (prev.status === 'sent' || prev.status === 'needs-tap') continue;
      if (prev.status === 'scheduled-native') {
        msg.results[c] = { ...prev, status: 'sent', at: this.now() };
        continue;
      }
      if (prev.status === 'failed' && prev.attempts >= MAX_ATTEMPTS) continue;
      const adapter = this.d.adapters[c];
      const attempts = prev.attempts + 1;
      try {
        const out = await adapter.send(msg, this.ctx(await this.d.creds.get(msg.userId, c)));
        if (out.ok) msg.results[c] = { status: out.needsTap ? 'needs-tap' : 'sent', attempts, externalId: out.externalId, at: this.now() };
        else {
          const canRetry = out.retryable && attempts < MAX_ATTEMPTS;
          retryable ||= canRetry;
          msg.results[c] = { status: canRetry ? 'pending' : 'failed', attempts, error: out.error, at: this.now() };
        }
      } catch (e) {
        const canRetry = attempts < MAX_ATTEMPTS;
        retryable ||= canRetry;
        msg.results[c] = { status: canRetry ? 'pending' : 'failed', attempts, error: e instanceof Error ? e.message : String(e), at: this.now() };
      }
    }

    msg.updatedAt = this.now();
    if (retryable) {
      const worst = Math.max(...msg.channels.map((c) => msg.results[c]?.attempts ?? 0));
      msg.status = 'scheduled';
      await this.d.store.put(msg);
      await this.d.queue.enqueue(msg.id, this.now() + BACKOFF_MS[Math.min(worst - 1, BACKOFF_MS.length - 1)]);
      this.d.log?.(`retry ${msg.id} in ${BACKOFF_MS[Math.min(worst - 1, BACKOFF_MS.length - 1)] / 1000}s`);
      return;
    }
    msg.status = rollup(msg.results, msg.channels);
    await this.d.store.put(msg);

    // repeats continue even if one channel failed; the failed instance stays visible for retry
    const next = nextOccurrence(msg.sendAt, msg.repeat, msg.timezone);
    if (next) {
      const t = this.now();
      const copy: ScheduledMessage = {
        ...msg,
        id: randomUUID(),
        sendAt: next,
        status: 'scheduled',
        results: {},
        createdAt: t,
        updatedAt: t,
        repeatOf: msg.repeatOf ?? msg.id,
      };
      await this.handOffNative(copy);
      await this.d.store.put(copy);
      await this.d.queue.enqueue(copy.id, copy.sendAt);
    }
  }
}

export class NotFound extends Error {
  constructor() {
    super('not found');
  }
}
