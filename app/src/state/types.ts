export type ThemePref = 'light' | 'dark' | 'system';
export type AIMode = 'on-device' | 'online';

export interface Settings {
  theme: ThemePref;
  mode: AIMode;
  floating: boolean;
  notifications: boolean;
  /** preferred reply / UI language label */
  language: string;
  /** minutes before a reminder to notify */
  reminderLead: number;
  /** speech synthesis rate 0.75..1.5 */
  voiceSpeed: number;
  /** text scale 0.9..1.25 */
  textSize: number;
}

export interface TodayItem {
  id: string;
  kind: 'reminder' | 'calendar' | 'followup';
  title: string;
  time: number;
  done: boolean;
  /** when it was created (History uses this) */
  createdAt?: number;
}

export interface Note {
  id: string;
  text: string;
  createdAt: number;
  color: 'violet' | 'blue' | 'green' | 'orange' | 'pink';
}

export type FMStatus = 'scheduled' | 'sending' | 'sent' | 'failed' | 'needs-tap';
export type FMRepeat = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type FMResult = 'sent' | 'failed' | 'needs-tap';

export interface FMMedia {
  kind: 'image' | 'video';
  name: string;
  /** small JPEG data URL preview (video: first frame) */
  thumb?: string;
  size?: number;
}

/** A scheduled (auto-send) message or post. Fields after `createdAt` were added in v0.4 and are optional for old data. */
export interface FutureMessage {
  id: string;
  /** recipient, contact, or the account/page for posts */
  to: string;
  text: string;
  /** epoch ms of the next send */
  when: number;
  status: FMStatus;
  createdAt?: number;
  /** Future Message channel ids (see future/channels.ts); default ['whatsapp'] */
  channels?: string[];
  subject?: string;
  media?: FMMedia;
  repeat?: FMRepeat;
  /** IANA zone the user picked the time in */
  tz?: string;
  attempts?: number;
  error?: string;
  sentAt?: number;
  /** per-channel outcome of the last attempt */
  results?: Record<string, FMResult>;
}

export type AttachmentKind =
  'image' | 'video' | 'file' | 'audio' | 'location' | 'contact' | 'app' | 'note' | 'scan' | 'screen' | 'generated';

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  mime?: string;
  size?: number;
  /** small preview (JPEG data URL) or tiny audio data URL */
  thumb?: string;
  /** extra line: coordinates, phone, duration, app id… */
  meta?: string;
}

export type ChatMode = 'web' | 'deep' | 'image';

export interface ChatMessage {
  id: string;
  from: 'me' | 'akaya';
  text: string;
  at: number;
  attachments?: Attachment[];
  modes?: ChatMode[];
}

export interface Chat {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
  icon: string;
}

export interface Agent {
  id: string;
  name: string;
  desc: string;
  on: boolean;
}

/** Logged interactions that don't live elsewhere in state (voice chats, floating replies, translations). */
export interface Activity {
  id: string;
  kind: 'voice' | 'floating' | 'translation';
  title: string;
  /** what the user said / typed */
  input: string;
  /** Akaya's answer, reply or translation */
  output: string;
  at: number;
  /** app the floating bubble was used in */
  app?: 'WhatsApp' | 'Gmail' | 'Messages';
  /** language pair for translations, e.g. "Hindi → English" */
  langs?: string;
}

import type { Connection } from '../integrations/types';
import type { VoiceNote } from '../notes/types';

export interface AppState {
  version: 1;
  auth: { signedIn: boolean; method?: 'google' | 'phone' | 'email'; contact?: string };
  onboardingDone: boolean;
  user: { name: string; email: string; phone: string };
  settings: Settings;
  today: TodayItem[];
  notes: Note[];
  future: FutureMessage[];
  activity: Activity[];
  /** connected apps keyed by app id */
  integrations: Record<string, Connection>;
  /** Voice Notes recordings (audio blobs live in IndexedDB) */
  voiceNotes: VoiceNote[];
  /** History screen metadata: pinned and removed entry keys */
  history: { pinned: string[]; hidden: string[] };
  chats: Chat[];
  notifications: AppNotification[];
  agents: Agent[];
}
