/** Builds the unified History feed from app state (chats, voice, floating, translations, reminders, notes…). */
import type { IconName } from '../components/Icon';
import type { AppState } from '../state/types';
import { fmtDate, fmtTime } from './time';
import { MODE_BY_ID } from '../notes/modes';
import { fmtClock } from '../notes/export';
import { APP_BY_ID } from '../integrations/catalog';

export type HistoryType =
  'chat' | 'voice' | 'floating' | 'followup' | 'reminder' | 'translation' | 'note' | 'future' | 'app' | 'vnote';

export interface HistoryItem {
  /** stable key, used for pin / delete */
  key: string;
  type: HistoryType;
  title: string;
  preview: string;
  at: number;
  /** extra meta shown in the tag row (e.g. "WhatsApp", "Done") */
  meta?: string;
  /** route to open, or null when the item opens a detail sheet */
  to: string | null;
  /** id of the source activity (for detail sheets) */
  ref?: string;
  /** integration app id (History shows its monogram) */
  appId?: string;
}

export const TYPE_META: Record<HistoryType, { label: string; tag: string; icon: IconName; tone: string }> = {
  chat: { label: 'Chat', tag: 'AI Chat', icon: 'ask', tone: 'violet' },
  voice: { label: 'Voice Chat', tag: 'Voice Chat', icon: 'mic', tone: 'blue' },
  floating: { label: 'Floating Chat', tag: 'Floating', icon: 'float', tone: 'cyan' },
  followup: { label: 'Follow-ups', tag: 'Follow-up', icon: 'follow', tone: 'green' },
  reminder: { label: 'Reminders', tag: 'Reminder', icon: 'alarm', tone: 'orange' },
  translation: { label: 'Translation', tag: 'Translation', icon: 'translate', tone: 'green' },
  note: { label: 'Notes', tag: 'Smart Note', icon: 'note', tone: 'pink' },
  future: { label: 'Future Message', tag: 'Future Message', icon: 'future', tone: 'violet' },
  app: { label: 'Apps', tag: 'App connected', icon: 'plug', tone: 'blue' },
  vnote: { label: 'Voice Notes', tag: 'Voice Note', icon: 'wave', tone: 'orange' },
};

export const FILTERS: ('all' | HistoryType)[] = [
  'all',
  'chat',
  'voice',
  'vnote',
  'floating',
  'followup',
  'reminder',
  'translation',
  'note',
  'future',
  'app',
];

const clip = (t: string, n = 120) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

export function buildHistory(s: AppState): HistoryItem[] {
  const out: HistoryItem[] = [];
  for (const c of s.chats) {
    if (!c.messages.length) continue;
    const firstMe = c.messages.find((m) => m.from === 'me');
    out.push({
      key: `chat:${c.id}`,
      type: 'chat',
      title: c.title,
      preview: clip(firstMe?.text ?? c.messages[0].text),
      at: c.updatedAt,
      meta: `${c.messages.length} messages`,
      to: `/chat/${c.id}`,
    });
  }
  for (const a of s.activity) {
    out.push({
      key: `act:${a.id}`,
      type: a.kind,
      title: a.title,
      preview: clip(a.kind === 'floating' ? a.output : a.kind === 'translation' ? a.output : a.input),
      at: a.at,
      meta: a.app ?? a.langs,
      to: null,
      ref: a.id,
    });
  }
  for (const t of s.today) {
    const type: HistoryType = t.kind === 'followup' ? 'followup' : 'reminder';
    out.push({
      key: `today:${t.id}`,
      type,
      title: t.kind === 'calendar' ? 'Event added' : type === 'followup' ? 'Follow-up' : 'Reminder set',
      preview: `${t.title} · ${dayGroup(t.time) === 'Today' ? 'today' : fmtDate(t.time)}, ${fmtTime(t.time)}`,
      at: t.createdAt ?? Math.min(t.time, Date.now()),
      meta: t.done ? 'Done' : t.kind === 'calendar' ? 'Calendar' : undefined,
      to: `/home?sheet=today&kind=${t.kind}`,
    });
  }
  for (const n of s.notes) {
    out.push({
      key: `note:${n.id}`,
      type: 'note',
      title: 'Smart Note',
      preview: clip(n.text),
      at: n.createdAt,
      to: '/notes',
    });
  }
  for (const m of s.future) {
    out.push({
      key: `future:${m.id}`,
      type: 'future',
      title: `Message to ${m.to}`,
      preview: clip(m.text),
      at: m.createdAt ?? Math.min(m.when, Date.now()),
      meta: `Sends ${fmtDate(m.when)}, ${fmtTime(m.when)}`,
      to: '/future',
    });
  }
  for (const c of Object.values(s.integrations ?? {})) {
    const app = APP_BY_ID[c.appId];
    if (!app) continue;
    out.push({
      key: `app:${c.appId}`,
      type: 'app',
      title: `Connected ${app.name}`,
      preview: app.desc,
      at: c.connectedAt,
      meta: c.account,
      to: `/apps?app=${app.id}`,
      appId: app.id,
    });
  }
  for (const v of s.voiceNotes ?? []) {
    out.push({
      key: `vnote:${v.id}`,
      type: 'vnote',
      title: v.title,
      preview: clip(v.notes.tldr || v.segments[0]?.text || ''),
      at: v.createdAt,
      meta: `${MODE_BY_ID[v.mode].label} · ${fmtClock(v.duration)}`,
      to: `/vnotes/${v.id}`,
    });
  }
  const hidden = new Set(s.history.hidden);
  return out.filter((i) => !hidden.has(i.key)).sort((a, b) => b.at - a.at);
}

/** "Today" / "Yesterday" / "Earlier" bucket for a timestamp. */
export function dayGroup(ts: number): 'Today' | 'Yesterday' | 'Earlier' {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (ts >= start.getTime()) return 'Today';
  if (ts >= start.getTime() - 86400000) return 'Yesterday';
  return 'Earlier';
}

export function itemTime(ts: number): string {
  const g = dayGroup(ts);
  if (g === 'Today') return fmtTime(ts);
  if (g === 'Yesterday') return `Yesterday, ${fmtTime(ts)}`;
  return `${new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${fmtTime(ts)}`;
}
