import type { ChannelId } from '../types.js';
import { CHANNELS } from '../channels.js';
import type { SenderAdapter } from './types.js';

/** Logs instead of sending. Text containing "#fail" fails once (retryable) to exercise retries. */
export function mockAdapter(channel: ChannelId, log: (line: string) => void = () => {}): SenderAdapter {
  return {
    channel,
    requires: [],
    async send(msg) {
      const attempt = msg.results[channel]?.attempts ?? 0;
      if (msg.text.includes('#fail') && attempt < 1) return { ok: false, retryable: true, error: 'mock: simulated outage', code: 'mock' };
      if (CHANNELS[channel].auto === 'tap') return { ok: true, needsTap: true };
      log(`[mock] ${channel} → ${msg.to}: ${msg.text.slice(0, 60)}`);
      return { ok: true, externalId: `mock-${channel}-${msg.id}` };
    },
  };
}
