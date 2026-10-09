import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertTimes, reminderView, suggestFollowUp, type Reminder } from '@akaya/reminders';
import { fmtWhen } from '@akaya/tz';
import { isNative, onNativeAction, showNow } from '../../native/notify';
import { useApp } from '../../state/store';
import { ACTIONS, setupReminderNotifications, syncReminderNotifications } from './notify';

export interface FiredAlert {
  key: string;
  reminder: Reminder;
  /** minutes before due (0 = at time) */
  before: number;
}

/**
 * Runs once inside the app:
 *  - native: keeps the OS alarm schedule in sync (fires when Akaya is closed) and handles Done / Snooze / Reschedule buttons;
 *  - web: fires alerts in-app (banner + inbox + browser notification);
 *  - both: keeps repeating reminders going after a miss, and (if enabled) creates smart follow-ups for missed ones.
 */
export function useReminderEngine(): { alert: FiredAlert | null; dismiss: () => void } {
  const { state, completeReminder, snoozeReminder, notify, rollMissedReminders, followUpReminder } = useApp();
  const nav = useNavigate();
  const [alert, setAlert] = useState<FiredAlert | null>(null);
  const live = useRef({ completeReminder, snoozeReminder, nav });
  useEffect(() => {
    live.current = { completeReminder, snoozeReminder, nav };
  });

  // native: channels + action buttons
  useEffect(() => {
    if (!isNative) return;
    void setupReminderNotifications();
    return onNativeAction((actionId, extra) => {
      const id = typeof extra.reminderId === 'string' ? extra.reminderId : null;
      if (!id) return;
      const l = live.current;
      if (actionId === ACTIONS.done) l.completeReminder(id);
      else if (actionId === ACTIONS.snooze) l.snoozeReminder(id, 10);
      else l.nav(`/reminders?id=${id}${actionId === ACTIONS.reschedule ? '&reschedule=1' : ''}`);
    });
  }, []);

  // native: sync the OS schedule (debounced)
  useEffect(() => {
    if (!isNative) return;
    const t = window.setTimeout(() => void syncReminderNotifications(state.reminders), 400);
    return () => window.clearTimeout(t);
  }, [state.reminders]);

  // missed repeating reminders roll forward; optional auto follow-up for missed one-offs
  const followed = useRef(new Set<string>());
  useEffect(() => {
    const now = Date.now();
    if (state.reminders.some((r) => r.repeat.kind !== 'none' && reminderView(r, now) === 'missed'))
      rollMissedReminders();
    if (!state.settings.autoFollowUp) return;
    const linked = new Set(state.reminders.map((r) => r.followUpOf).filter(Boolean));
    for (const r of state.reminders) {
      if (r.repeat.kind !== 'none' || r.source === 'follow-up' || linked.has(r.id) || followed.current.has(r.id))
        continue;
      if (reminderView(r, now) !== 'missed') continue;
      followed.current.add(r.id);
      followUpReminder(r.id, suggestFollowUp(r, now));
    }
  }, [state.reminders, state.settings.autoFollowUp, rollMissedReminders, followUpReminder]);

  // web: in-app alerts at each alert time
  const fired = useRef(new Set<string>());
  useEffect(() => {
    if (isNative) return;
    const now = Date.now();
    let next = Infinity;
    for (const r of state.reminders) for (const t of alertTimes(r, now - 1000)) next = Math.min(next, t);
    if (!Number.isFinite(next)) return;
    const timer = window.setTimeout(
      () => {
        const at = Date.now();
        for (const r of state.reminders) {
          for (const t of alertTimes(r, at - 60_000)) {
            const key = `${r.id}:${t}`;
            if (t > at + 500 || fired.current.has(key)) continue;
            fired.current.add(key);
            const before = Math.max(0, Math.round((r.due - t) / 60_000));
            setAlert({ key, reminder: r, before });
            const body = before ? `Due ${fmtWhen(r.due)}` : 'Due now';
            notify(r.title, body, 'alarm');
            showNow(r.title, body);
          }
        }
      },
      Math.max(0, Math.min(next - now, 2 ** 31 - 1)),
    );
    return () => window.clearTimeout(timer);
  }, [state.reminders, notify]);

  // the banner follows the live reminder (snoozed/done elsewhere → it closes)
  const current = alert && state.reminders.find((r) => r.id === alert.reminder.id);
  const shown = alert && current && current.status !== 'done' ? { ...alert, reminder: current } : null;
  return { alert: shown, dismiss: () => setAlert(null) };
}
