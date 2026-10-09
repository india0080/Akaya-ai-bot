import type { ChannelId } from './types.js';

/**
 * What each channel can honestly do.
 *  api       – official API sends as the user once they connect (OAuth)
 *  business  – official API, but only from a business number / bot / Page / professional account
 *  tap       – no official API for personal accounts: we send a reminder push with a one-tap, pre-filled deep link
 */
export type AutoLevel = 'api' | 'business' | 'tap';

export interface ChannelInfo {
  id: ChannelId;
  label: string;
  kind: 'chat' | 'email' | 'post';
  auto: AutoLevel;
  api: string;
  maxLen?: number;
  needsMedia?: 'image' | 'video' | 'any';
  /** platform can hold the message itself (we hand it off at schedule time) */
  nativeSchedule?: boolean;
  limits: string;
}

export const CHANNELS: Record<ChannelId, ChannelInfo> = {
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp (personal)',
    kind: 'chat',
    auto: 'tap',
    api: 'none',
    limits: 'No official API for personal accounts. Reminder push + wa.me deep link; the user taps Send.',
  },
  'whatsapp-business': {
    id: 'whatsapp-business',
    label: 'WhatsApp Business',
    kind: 'chat',
    auto: 'business',
    api: 'WhatsApp Cloud API',
    limits: 'Free-form text only within 24 h of the customer’s last message; otherwise an approved template.',
  },
  telegram: {
    id: 'telegram',
    label: 'Telegram',
    kind: 'chat',
    auto: 'business',
    api: 'Telegram Bot API',
    maxLen: 4096,
    limits: 'Sends as the Akaya bot, only to chats that started the bot. Personal-account sending is not offered.',
  },
  gmail: { id: 'gmail', label: 'Gmail', kind: 'email', auto: 'api', api: 'Gmail API users.messages.send', limits: 'Needs gmail.send scope; Google app verification for production.' },
  outlook: { id: 'outlook', label: 'Outlook', kind: 'email', auto: 'api', api: 'Microsoft Graph sendMail', limits: 'Needs Mail.Send delegated permission.' },
  slack: {
    id: 'slack',
    label: 'Slack',
    kind: 'chat',
    auto: 'api',
    api: 'chat.scheduleMessage / chat.postMessage',
    nativeSchedule: true,
    maxLen: 40000,
    limits: 'Native scheduling up to 120 days ahead; the bot must be in the channel (or use a user token).',
  },
  teams: { id: 'teams', label: 'Microsoft Teams', kind: 'chat', auto: 'api', api: 'Graph chatMessage', limits: 'Needs ChatMessage.Send; posting into channels needs ChannelMessage.Send.' },
  messenger: { id: 'messenger', label: 'Messenger', kind: 'chat', auto: 'business', api: 'Messenger Send API', limits: 'Facebook Pages only, standard messaging window / tags apply.' },
  'instagram-dm': {
    id: 'instagram-dm',
    label: 'Instagram DM',
    kind: 'chat',
    auto: 'business',
    api: 'Instagram Messaging API',
    limits: 'Professional accounts only; within 24 h of the user’s last message.',
  },
  signal: { id: 'signal', label: 'Signal', kind: 'chat', auto: 'tap', api: 'none', limits: 'No official API. Reminder push + sgnl:// deep link.' },
  sms: {
    id: 'sms',
    label: 'SMS',
    kind: 'chat',
    auto: 'tap',
    api: 'none (device)',
    limits: 'From the user’s own number only via the device (Android default-SMS role). Business SMS via a provider is out of scope.',
  },
  discord: { id: 'discord', label: 'Discord', kind: 'chat', auto: 'business', api: 'Channel webhook / bot', maxLen: 2000, limits: 'Webhook or bot posts into a server channel, not personal DMs.' },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    kind: 'post',
    auto: 'business',
    api: 'Instagram Content Publishing API',
    maxLen: 2200,
    needsMedia: 'any',
    limits: 'Business/Creator accounts; image or video required; 50 API posts per 24 h.',
  },
  facebook: { id: 'facebook', label: 'Facebook Page', kind: 'post', auto: 'business', api: 'Pages API', maxLen: 63206, limits: 'Pages only; personal profiles cannot be posted to.' },
  x: { id: 'x', label: 'X', kind: 'post', auto: 'api', api: 'X API v2 POST /2/tweets', maxLen: 280, limits: 'Paid API tier; image upload supported in this stub, video not.' },
  linkedin: { id: 'linkedin', label: 'LinkedIn', kind: 'post', auto: 'api', api: 'Posts API (/rest/posts)', maxLen: 3000, limits: 'w_member_social for profiles; Pages need Community Management API access.' },
  youtube: {
    id: 'youtube',
    label: 'YouTube / Shorts',
    kind: 'post',
    auto: 'api',
    api: 'YouTube Data API videos.insert',
    needsMedia: 'video',
    limits: 'Video required; unverified API projects upload as private.',
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    kind: 'post',
    auto: 'business',
    api: 'Content Posting API (direct post)',
    maxLen: 2200,
    needsMedia: 'video',
    limits: 'Unaudited apps can only post SELF_ONLY (private).',
  },
  threads: { id: 'threads', label: 'Threads', kind: 'post', auto: 'api', api: 'Threads API', maxLen: 500, limits: '250 API posts per 24 h.' },
  pinterest: { id: 'pinterest', label: 'Pinterest', kind: 'post', auto: 'api', api: 'Pinterest API v5 pins', maxLen: 500, needsMedia: 'any', limits: 'Needs a board id.' },
};

export function validateForChannel(id: ChannelId, text: string, media?: { kind: 'image' | 'video' }): string[] {
  const c = CHANNELS[id];
  const out: string[] = [];
  if (c.maxLen && text.length > c.maxLen) out.push(`${c.label}: text is ${text.length}/${c.maxLen} characters`);
  if (c.needsMedia === 'video' && media?.kind !== 'video') out.push(`${c.label}: a video is required`);
  if (c.needsMedia === 'any' && !media) out.push(`${c.label}: an image or video is required`);
  return out;
}
