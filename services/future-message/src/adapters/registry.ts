import type { ChannelId } from '../types.js';
import { CHANNELS } from '../channels.js';
import type { SenderAdapter } from './types.js';
import { discord, gmail, instagramDm, messenger, outlook, slack, teams, telegram, whatsappCloud } from './chat.js';
import { facebook, instagram, linkedin, pinterest, threads, tiktok, x, youtube } from './social.js';
import { mockAdapter } from './mock.js';
import { reminderAdapter, type Notifier } from './reminder.js';

export const LIVE_ADAPTERS: Partial<Record<ChannelId, SenderAdapter>> = {
  'whatsapp-business': whatsappCloud,
  telegram,
  gmail,
  outlook,
  slack,
  teams,
  messenger,
  'instagram-dm': instagramDm,
  discord,
  instagram,
  facebook,
  x,
  linkedin,
  youtube,
  tiktok,
  threads,
  pinterest,
};

/** mode 'mock' logs every send; 'live' calls real APIs. "tap" channels always use the reminder adapter. */
export function buildRegistry(mode: 'mock' | 'live', notifier: Notifier, log?: (s: string) => void): Record<ChannelId, SenderAdapter> {
  const out = {} as Record<ChannelId, SenderAdapter>;
  for (const id of Object.keys(CHANNELS) as ChannelId[]) {
    if (CHANNELS[id].auto === 'tap') out[id] = reminderAdapter(id, notifier);
    else out[id] = mode === 'live' ? (LIVE_ADAPTERS[id] ?? mockAdapter(id, log)) : mockAdapter(id, log);
  }
  return out;
}
