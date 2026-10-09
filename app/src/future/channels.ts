/**
 * Future Message channels. `appId` points at the integrations catalog (for the real logo).
 * `auto` is honest about what can send unattended:
 *  - 'api':      official API can send/publish at the scheduled time once connected
 *  - 'business': official API, but only from a business account / bot / page (not a personal profile)
 *  - 'tap':      no official API for personal accounts: Akaya notifies you at the time with a one-tap, pre-filled send
 */
export type ChannelKind = 'chat' | 'email' | 'post';
export type AutoLevel = 'api' | 'business' | 'tap';

export interface FMChannel {
  id: string;
  appId: string;
  label: string;
  kind: ChannelKind;
  auto: AutoLevel;
  /** shown under the channel in the composer */
  note: string;
  recipient: string;
  maxLen?: number;
  /** post needs an image or video */
  needsMedia?: 'image' | 'video' | 'any';
  /** deep link that opens the app pre-filled (used for 'tap' channels) */
  deeplink?: (to: string, text: string) => string;
}

const enc = encodeURIComponent;

export const CHANNELS: FMChannel[] = [
  // Chats & email
  {
    id: 'whatsapp',
    appId: 'whatsapp',
    label: 'WhatsApp',
    kind: 'chat',
    auto: 'tap',
    note: 'Personal WhatsApp has no official API: you get a notification and send with one tap.',
    recipient: 'Contact or phone',
    deeplink: (_to, t) => `https://wa.me/?text=${enc(t)}`,
  },
  {
    id: 'whatsapp-business',
    appId: 'whatsapp-business',
    label: 'WhatsApp Business',
    kind: 'chat',
    auto: 'business',
    note: 'Cloud API. Outside the 24-hour window an approved template is used.',
    recipient: 'Customer phone',
  },
  {
    id: 'telegram',
    appId: 'telegram',
    label: 'Telegram',
    kind: 'chat',
    auto: 'business',
    note: 'Sent by your Akaya bot (Bot API) to chats that started it.',
    recipient: 'Chat or @username',
  },
  {
    id: 'gmail',
    appId: 'gmail',
    label: 'Gmail',
    kind: 'email',
    auto: 'api',
    note: 'Gmail API sends from your address.',
    recipient: 'Email address',
  },
  {
    id: 'outlook',
    appId: 'outlook',
    label: 'Outlook',
    kind: 'email',
    auto: 'api',
    note: 'Microsoft Graph sendMail.',
    recipient: 'Email address',
  },
  {
    id: 'slack',
    appId: 'slack',
    label: 'Slack',
    kind: 'chat',
    auto: 'api',
    note: 'Slack chat.scheduleMessage (up to 120 days ahead).',
    recipient: '#channel or @person',
  },
  {
    id: 'teams',
    appId: 'teams',
    label: 'Teams',
    kind: 'chat',
    auto: 'api',
    note: 'Microsoft Graph chat message as you.',
    recipient: 'Chat or channel',
  },
  {
    id: 'messenger',
    appId: 'messenger',
    label: 'Messenger',
    kind: 'chat',
    auto: 'business',
    note: 'Facebook Page inbox only, within Meta messaging windows.',
    recipient: 'Page conversation',
  },
  {
    id: 'instagram-dm',
    appId: 'instagram',
    label: 'Instagram DM',
    kind: 'chat',
    auto: 'business',
    note: 'Professional accounts only, within 24 h of the person’s last message.',
    recipient: 'Conversation',
  },
  {
    id: 'signal',
    appId: 'signal',
    label: 'Signal',
    kind: 'chat',
    auto: 'tap',
    note: 'No official API: one-tap send from a reminder.',
    recipient: 'Contact',
    deeplink: (_to, t) => `sgnl://send?text=${enc(t)}`,
  },
  {
    id: 'sms',
    appId: 'google-messages',
    label: 'SMS',
    kind: 'chat',
    auto: 'tap',
    note: 'Opens Messages pre-filled. Background SMS needs the default SMS app role.',
    recipient: 'Phone number',
    deeplink: (to, t) => `sms:${to.replace(/[^\d+]/g, '')}?body=${enc(t)}`,
  },
  {
    id: 'discord',
    appId: 'discord',
    label: 'Discord',
    kind: 'chat',
    auto: 'business',
    note: 'Bot or channel webhook.',
    recipient: 'Server channel',
  },
  // Social posts
  {
    id: 'instagram',
    appId: 'instagram',
    label: 'Instagram',
    kind: 'post',
    auto: 'business',
    note: 'Content Publishing API: Business/Creator account, image or video required.',
    recipient: 'Account',
    maxLen: 2200,
    needsMedia: 'any',
  },
  {
    id: 'facebook',
    appId: 'facebook',
    label: 'Facebook Page',
    kind: 'post',
    auto: 'business',
    note: 'Pages API (Pages only, not personal profiles).',
    recipient: 'Page',
    maxLen: 63206,
  },
  {
    id: 'x',
    appId: 'x',
    label: 'X',
    kind: 'post',
    auto: 'api',
    note: 'X API v2 (paid API tier).',
    recipient: 'Account',
    maxLen: 280,
  },
  {
    id: 'linkedin',
    appId: 'linkedin',
    label: 'LinkedIn',
    kind: 'post',
    auto: 'api',
    note: 'Posts API for your profile or Page.',
    recipient: 'Profile or Page',
    maxLen: 3000,
  },
  {
    id: 'youtube',
    appId: 'youtube',
    label: 'YouTube / Shorts',
    kind: 'post',
    auto: 'api',
    note: 'Data API upload with publishAt. Video required; first line is the title.',
    recipient: 'Channel',
    maxLen: 5000,
    needsMedia: 'video',
  },
  {
    id: 'tiktok',
    appId: 'tiktok',
    label: 'TikTok',
    kind: 'post',
    auto: 'business',
    note: 'Content Posting API. Unaudited apps can only post privately.',
    recipient: 'Account',
    maxLen: 2200,
    needsMedia: 'video',
  },
  {
    id: 'threads',
    appId: 'threads',
    label: 'Threads',
    kind: 'post',
    auto: 'api',
    note: 'Threads API publishing.',
    recipient: 'Account',
    maxLen: 500,
  },
  {
    id: 'pinterest',
    appId: 'pinterest',
    label: 'Pinterest',
    kind: 'post',
    auto: 'api',
    note: 'Pins API to a board. Image or video required.',
    recipient: 'Board',
    maxLen: 500,
    needsMedia: 'any',
  },
];

export const CHANNEL_BY_ID: Record<string, FMChannel> = Object.fromEntries(CHANNELS.map((c) => [c.id, c]));

export const AUTO_LABEL: Record<AutoLevel, string> = {
  api: 'Auto-send',
  business: 'Auto · business',
  tap: 'One-tap send',
};

/** Validation errors for a draft, per channel. */
export function channelIssues(ch: FMChannel, text: string, media?: { kind: 'image' | 'video' }): string[] {
  const out: string[] = [];
  if (ch.maxLen && text.length > ch.maxLen) out.push(`${ch.label}: ${text.length}/${ch.maxLen} characters`);
  if (ch.needsMedia === 'video' && media?.kind !== 'video') out.push(`${ch.label} needs a video`);
  if (ch.needsMedia === 'any' && !media) out.push(`${ch.label} needs an image or video`);
  return out;
}
