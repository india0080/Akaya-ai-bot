export type ChannelId =
  | 'whatsapp'
  | 'whatsapp-business'
  | 'telegram'
  | 'gmail'
  | 'outlook'
  | 'slack'
  | 'teams'
  | 'messenger'
  | 'instagram-dm'
  | 'signal'
  | 'sms'
  | 'discord'
  | 'instagram'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'threads'
  | 'pinterest';

export type Repeat = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type MessageStatus = 'scheduled' | 'sending' | 'sent' | 'partial' | 'failed' | 'needs-tap' | 'cancelled';
export type ChannelStatus = 'pending' | 'sent' | 'failed' | 'needs-tap' | 'scheduled-native';

export interface Media {
  kind: 'image' | 'video';
  /** public HTTPS URL (Meta, TikTok and Pinterest pull media from a URL) */
  url: string;
  mime?: string;
  name?: string;
}

export interface ChannelResult {
  status: ChannelStatus;
  attempts: number;
  externalId?: string;
  error?: string;
  at?: number;
}

export interface ScheduledMessage {
  id: string;
  userId: string;
  channels: ChannelId[];
  /** human recipient label */
  to: string;
  /** per-channel address: phone, chat_id, email, Slack channel id, page id… (falls back to `to`) */
  targets?: Partial<Record<ChannelId, string>>;
  subject?: string;
  text: string;
  media?: Media;
  /** epoch ms of the next send (UTC) */
  sendAt: number;
  /** IANA zone the user chose; repeats keep this wall-clock time */
  timezone: string;
  repeat: Repeat;
  status: MessageStatus;
  results: Partial<Record<ChannelId, ChannelResult>>;
  createdAt: number;
  updatedAt: number;
  /** id of the instance this one repeats from */
  repeatOf?: string;
}

export type SendOutcome =
  | { ok: true; externalId?: string; needsTap?: boolean; deeplink?: string }
  | { ok: false; retryable: boolean; error: string; code?: string };
