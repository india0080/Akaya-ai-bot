/** Reminders slice of the app store: actions (spread into useApp) and the v0.4 → v0.5 migration of Today reminders. */
import {
  complete,
  makeFollowUp,
  markPending,
  mergeReminders,
  parseReminder,
  reschedule,
  rollMissed,
  snooze,
  type FollowUp,
  type Reminder,
} from '@akaya/reminders';
import { uid } from '../../lib/time';
import type { AppState } from '../../state/types';

/** what a composer / chat / voice / template produces */
export type ReminderDraft = Omit<Reminder, 'id' | 'status' | 'createdAt'>;

type Patch = (fn: (s: AppState) => AppState) => void;

const mapOne = (s: AppState, id: string, fn: (r: Reminder) => Reminder): AppState => ({
  ...s,
  reminders: s.reminders.map((r) => (r.id === id ? fn(r) : r)),
});

export function reminderActions(patch: Patch) {
  return {
    /** adds a reminder and returns its id */
    addReminder: (d: ReminderDraft): string => {
      const id = uid();
      patch((s) => ({ ...s, reminders: [...s.reminders, { ...d, id, status: 'pending', createdAt: Date.now() }] }));
      return id;
    },
    updateReminder: (id: string, fn: (r: Reminder) => Reminder) => patch((s) => mapOne(s, id, fn)),
    deleteReminder: (id: string) => patch((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) })),
    /** undo for delete / edit: put the exact previous object back */
    restoreReminder: (r: Reminder) =>
      patch((s) => ({ ...s, reminders: [...s.reminders.filter((x) => x.id !== r.id), r] })),
    completeReminder: (id: string) =>
      patch((s) => {
        const r = s.reminders.find((x) => x.id === id);
        if (!r || r.status === 'done') return s;
        const { done, next } = complete(r, Date.now(), uid);
        return { ...s, reminders: [...s.reminders.map((x) => (x.id === id ? done : x)), ...(next ? [next] : [])] };
      }),
    snoozeReminder: (id: string, minutes: number) => patch((s) => mapOne(s, id, (r) => snooze(r, minutes, Date.now()))),
    rescheduleReminder: (id: string, due: number) => patch((s) => mapOne(s, id, (r) => reschedule(r, due))),
    setReminderPending: (id: string) => patch((s) => mapOne(s, id, markPending)),
    /** Merge (duplicate dialog): fold the draft into the existing reminder */
    mergeReminder: (id: string, d: ReminderDraft) =>
      patch((s) => mapOne(s, id, (r) => mergeReminders(r, { ...d, status: 'pending', createdAt: Date.now() }))),
    /** smart follow-up: a new reminder linked to the missed / pending one; returns its id */
    followUpReminder: (id: string, f: FollowUp): string => {
      const nid = uid();
      patch((s) => {
        const r = s.reminders.find((x) => x.id === id);
        return r ? { ...s, reminders: [...s.reminders, makeFollowUp(r, f, nid, Date.now())] } : s;
      });
      return nid;
    },
    /** keep repeating reminders going after a miss (runs from the engine) */
    rollMissedReminders: () =>
      patch((s) => {
        const now = Date.now();
        let changed = false;
        const out: Reminder[] = [];
        for (const r of s.reminders) {
          const { missed, next } = rollMissed(r, now, uid);
          out.push(missed);
          if (next) {
            out.push(next);
            changed = true;
          }
        }
        return changed ? { ...s, reminders: out } : s;
      }),
  };
}

/** v0.4 kept reminders as Today items (kind 'reminder'); move them into `reminders` once. */
export function migrateReminders(s: AppState, reminderLead: number): AppState {
  type Legacy = { id: string; kind: string; title: string; time: number; done: boolean; createdAt?: number };
  const legacy = (s.today as unknown as Legacy[]).filter((t) => t.kind === 'reminder');
  if (!legacy.length) return s;
  const moved: Reminder[] = legacy.map((t) => {
    const p = parseReminder(t.title);
    return {
      id: `legacy-${t.id}`,
      title: t.title,
      category: p.category,
      priority: p.priority,
      due: t.time,
      alerts: [reminderLead, 0],
      repeat: { kind: 'none' },
      status: t.done ? 'done' : 'pending',
      doneAt: t.done ? t.time : undefined,
      createdAt: t.createdAt ?? t.time,
      source: 'form',
    };
  });
  return {
    ...s,
    today: s.today.filter((t) => (t.kind as string) !== 'reminder'),
    reminders: [...s.reminders.filter((r) => !moved.some((m) => m.id === r.id)), ...moved],
  };
}
