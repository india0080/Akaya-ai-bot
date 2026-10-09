/** Reminder lifecycle: status/views, sorting, repeats, snooze, alerts, follow-ups, duplicates, filters, streaks. */
import { epochToZoned, nextOccurrence, zonedToEpoch } from '@akaya/tz';
import { PRIORITY_RANK } from './categories.js';
import { addDays, weekday } from './dates.js';
import type { CategoryId, Priority, Reminder, ReminderView } from './types.js';

const MIN = 60_000;
export const DEFAULT_TZ = 'Asia/Kolkata';
/** a pending reminder counts as missed this long after it was due */
export const MISSED_GRACE_MIN = 15;

/** when the reminder fires next (snooze wins over the original time) */
export const effectiveDue = (r: Reminder): number => r.snoozedUntil ?? r.due;

export function reminderView(r: Reminder, now: number): ReminderView {
  if (r.status === 'done') return 'completed';
  return effectiveDue(r) < now - MISSED_GRACE_MIN * MIN ? 'missed' : 'upcoming';
}

export type SortMode = 'time' | 'priority';

/** upcoming: soonest first; completed: latest first; missed: most recent first. 'priority' sorts by rank, then time. */
export function sortReminders(list: Reminder[], view: ReminderView, mode: SortMode = 'time'): Reminder[] {
  const time = (r: Reminder) =>
    view === 'completed' ? -(r.doneAt ?? r.due) : view === 'missed' ? -effectiveDue(r) : effectiveDue(r);
  return [...list].sort((a, b) =>
    mode === 'priority'
      ? PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || time(a) - time(b)
      : time(a) - time(b) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );
}

/** next due time after `r.due` for a repeating reminder (null when it does not repeat) */
export function nextDue(r: Pick<Reminder, 'due' | 'repeat'>, tz = DEFAULT_TZ): number | null {
  const { kind, weekdays, everyDays } = r.repeat;
  const { date, time } = epochToZoned(r.due, tz);
  if (kind === 'none') return null;
  if (kind === 'custom') return zonedToEpoch(addDays(date, Math.max(1, everyDays ?? 1)), time, tz);
  if (kind === 'weekly' && weekdays?.length) {
    for (let i = 1; i <= 7; i++)
      if (weekdays.includes(weekday(addDays(date, i)))) return zonedToEpoch(addDays(date, i), time, tz);
  }
  return nextOccurrence(r.due, kind, tz);
}

/** first occurrence strictly after `after` (skips occurrences that were missed while the app was closed) */
export function nextDueAfter(r: Pick<Reminder, 'due' | 'repeat'>, after: number, tz = DEFAULT_TZ): number | null {
  let due = r.due;
  for (let i = 0; i < 2000; i++) {
    const n = nextDue({ due, repeat: r.repeat }, tz);
    if (n === null) return null;
    if (n > after) return n;
    due = n;
  }
  return null;
}

/** alert instants (ascending) for the reminder; includes the snooze time when snoozed */
export function alertTimes(r: Reminder, now = 0): number[] {
  if (r.status === 'done') return [];
  const at = new Set(r.alerts.map((m) => r.due - m * MIN));
  if (r.snoozedUntil) at.add(r.snoozedUntil);
  if (at.size === 0) at.add(r.due);
  return [...at].filter((t) => t > now).sort((a, b) => a - b);
}

export const snooze = (r: Reminder, minutes: number, now: number): Reminder => ({
  ...r,
  snoozedUntil: now + minutes * MIN,
  status: 'pending',
});

export const reschedule = (r: Reminder, due: number): Reminder => ({
  ...r,
  due,
  snoozedUntil: undefined,
  status: 'pending',
  doneAt: undefined,
});

export const markPending = (r: Reminder): Reminder => ({ ...r, status: 'pending', doneAt: undefined });

/**
 * Mark done. A repeating reminder stays in the list as a completed occurrence and returns the next occurrence
 * as a fresh pending reminder (`next`, id from `newId`).
 */
export function complete(
  r: Reminder,
  now: number,
  newId: () => string,
  tz = DEFAULT_TZ,
): { done: Reminder; next?: Reminder } {
  const done: Reminder = { ...r, status: 'done', doneAt: now, snoozedUntil: undefined };
  const due = nextDueAfter(r, Math.max(now, r.due), tz);
  if (due === null) return { done };
  return {
    done: { ...done, repeat: { kind: 'none' } },
    next: { ...r, id: newId(), due, status: 'pending', snoozedUntil: undefined, doneAt: undefined, createdAt: now },
  };
}

/**
 * A repeating reminder that was missed: the missed occurrence stays (as a one-off, so it shows under Missed) and the
 * schedule continues from the next occurrence after `now`.
 */
export function rollMissed(
  r: Reminder,
  now: number,
  newId: () => string,
  tz = DEFAULT_TZ,
): { missed: Reminder; next?: Reminder } {
  const due = nextDueAfter(r, now, tz);
  if (due === null || reminderView(r, now) !== 'missed') return { missed: r };
  return {
    missed: { ...r, repeat: { kind: 'none' } },
    next: { ...r, id: newId(), due, snoozedUntil: undefined, createdAt: now, sample: undefined },
  };
}

/* ───────── smart follow-up ───────── */

export interface FollowUp {
  due: number;
  /** "In 1 hour" / "Tomorrow 10:00 AM" */
  label: string;
  reason: string;
}

/**
 * Suggest the next slot for a missed or still-pending reminder: urgent → 15 min, high → 1 hour, otherwise
 * later today at the next round hour before 8 PM, else tomorrow 10:00 AM (IST).
 */
export function suggestFollowUp(r: Reminder, now: number, tz = DEFAULT_TZ): FollowUp {
  const reason = reminderView(r, now) === 'missed' ? 'You missed this' : 'Still pending';
  const { date, time } = epochToZoned(now, tz);
  const hour = Number(time.slice(0, 2));
  if (r.priority === 'urgent') return { due: roundUp(now + 15 * MIN, 5), label: 'In 15 min', reason };
  if (r.priority === 'high' && hour < 21) return { due: roundUp(now + 60 * MIN, 15), label: 'In 1 hour', reason };
  if (hour < 19) {
    const due = zonedToEpoch(date, `${String(hour + 2).padStart(2, '0')}:00`, tz);
    return { due, label: `Today ${fmtHour(hour + 2)}`, reason };
  }
  return { due: zonedToEpoch(addDays(date, 1), '10:00', tz), label: 'Tomorrow 10:00 AM', reason };
}

const roundUp = (t: number, minutes: number) => Math.ceil(t / (minutes * MIN)) * minutes * MIN;
const fmtHour = (h: number) => `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`;

export function makeFollowUp(r: Reminder, f: FollowUp, id: string, now: number): Reminder {
  return {
    ...r,
    id,
    due: f.due,
    alerts: [0],
    repeat: { kind: 'none' },
    status: 'pending',
    snoozedUntil: undefined,
    doneAt: undefined,
    createdAt: now,
    source: 'follow-up',
    followUpOf: r.id,
  };
}

/* ───────── duplicate detection ───────── */

const STOP = new Set([
  'to',
  'the',
  'a',
  'an',
  'for',
  'about',
  'my',
  'ka',
  'ki',
  'ke',
  'ko',
  'का',
  'की',
  'के',
  'को',
  'and',
  'aur',
]);

export function normTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .join(' ');
}

function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/** 0..1 title similarity: the better of edit-distance ratio and word overlap */
export function titleSimilarity(a: string, b: string): number {
  const x = normTitle(a);
  const y = normTitle(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const edit = 1 - levenshtein(x, y) / Math.max(x.length, y.length);
  const wx = new Set(x.split(' '));
  const wy = new Set(y.split(' '));
  const inter = [...wx].filter((w) => wy.has(w)).length;
  const overlap = inter / Math.min(wx.size, wy.size); // "call rahul" vs "call rahul about invoice" = 1
  return Math.max(edit, inter >= 2 || wx.size === 1 || wy.size === 1 ? overlap : 0);
}

export interface DuplicateMatch {
  reminder: Reminder;
  score: number;
}

/** an open reminder with a similar title within ±`windowMin` (default 2 h) of `due`, or the same title on the same IST day */
export function findDuplicate(
  candidate: Pick<Reminder, 'title' | 'due'> & { id?: string },
  list: Reminder[],
  { windowMin = 120, tz = DEFAULT_TZ } = {},
): DuplicateMatch | null {
  const day = (t: number) => epochToZoned(t, tz).date;
  let best: DuplicateMatch | null = null;
  for (const r of list) {
    if (r.status === 'done' || r.id === candidate.id) continue;
    const score = titleSimilarity(candidate.title, r.title);
    const near = Math.abs(effectiveDue(r) - candidate.due) <= windowMin * MIN;
    const sameDay = day(r.due) === day(candidate.due);
    if ((score >= 0.8 && near) || (score === 1 && sameDay))
      if (!best || score > best.score) best = { reminder: r, score };
  }
  return best;
}

/** Merge: keep the existing reminder (and its id), take the new time, union the alerts, keep the higher priority. */
export function mergeReminders(existing: Reminder, incoming: Omit<Reminder, 'id'>): Reminder {
  const priority: Priority =
    PRIORITY_RANK[incoming.priority] < PRIORITY_RANK[existing.priority] ? incoming.priority : existing.priority;
  const notes = [existing.notes, incoming.notes].filter(Boolean).join('\n') || undefined;
  return {
    ...existing,
    title: existing.title.length >= incoming.title.length ? existing.title : incoming.title,
    due: incoming.due,
    snoozedUntil: undefined,
    alerts: [...new Set([...existing.alerts, ...incoming.alerts])].sort((a, b) => b - a),
    priority,
    notes,
    repeat: incoming.repeat.kind !== 'none' ? incoming.repeat : existing.repeat,
  };
}

/* ───────── dashboard queries ───────── */

export interface ReminderFilter {
  view?: ReminderView;
  category?: CategoryId | 'all';
  priority?: Priority | 'all';
  q?: string;
  /** only reminders due on this IST date (YYYY-MM-DD) */
  date?: string;
}

export function filterReminders(list: Reminder[], f: ReminderFilter, now: number, tz = DEFAULT_TZ): Reminder[] {
  const q = f.q?.trim().toLowerCase();
  return list.filter(
    (r) =>
      (!f.view || reminderView(r, now) === f.view) &&
      (!f.category || f.category === 'all' || r.category === f.category) &&
      (!f.priority || f.priority === 'all' || r.priority === f.priority) &&
      (!f.date || epochToZoned(effectiveDue(r), tz).date === f.date) &&
      (!q || r.title.toLowerCase().includes(q) || (r.notes ?? '').toLowerCase().includes(q)),
  );
}

export function countByView(list: Reminder[], now: number): Record<ReminderView, number> {
  const out: Record<ReminderView, number> = { upcoming: 0, completed: 0, missed: 0 };
  for (const r of list) out[reminderView(r, now)]++;
  return out;
}

/** consecutive IST days (ending today, or yesterday if nothing is done yet today) with at least one completed reminder in the set */
export function streakDays(list: Reminder[], now: number, tz = DEFAULT_TZ): number {
  const days = new Set(list.filter((r) => r.doneAt).map((r) => epochToZoned(r.doneAt!, tz).date));
  let d = epochToZoned(now, tz).date;
  if (!days.has(d)) d = addDays(d, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** first occurrence for a template: today at `time` if still ahead (or `inDays` from today) */
export function templateDue(time: string, now: number, inDays?: number, tz = DEFAULT_TZ): number {
  const today = epochToZoned(now, tz).date;
  if (inDays) return zonedToEpoch(addDays(today, inDays), time, tz);
  const t = zonedToEpoch(today, time, tz);
  return t > now ? t : zonedToEpoch(addDays(today, 1), time, tz);
}

export function repeatLabel(r: Pick<Reminder, 'repeat'>): string {
  const { kind, weekdays, everyDays } = r.repeat;
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  switch (kind) {
    case 'none':
      return 'Once';
    case 'daily':
      return 'Every day';
    case 'weekly':
      if (weekdays?.length === 5 && [1, 2, 3, 4, 5].every((d) => weekdays.includes(d))) return 'Weekdays';
      return weekdays?.length ? `Every ${weekdays.map((d) => WD[d]).join(', ')}` : 'Every week';
    case 'monthly':
      return 'Every month';
    case 'yearly':
      return 'Every year';
    case 'custom':
      return everyDays === 1 ? 'Every day' : `Every ${everyDays} days`;
  }
}
