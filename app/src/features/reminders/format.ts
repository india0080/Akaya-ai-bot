/** Non-component helpers for reminder UIs (kept apart from parts.tsx for fast refresh). */
import { addDays, effectiveDue, PRIORITIES, weekday, type Priority, type Reminder } from '@akaya/reminders';
import { epochToZoned, fmtWhen, zonedToEpoch } from '@akaya/tz';

const TZ = 'Asia/Kolkata';

export const PRIORITY_COLOR = Object.fromEntries(PRIORITIES.map((p) => [p.id, p.color])) as Record<Priority, string>;
export const PRIORITY_LABEL = Object.fromEntries(PRIORITIES.map((p) => [p.id, p.label])) as Record<Priority, string>;

/** "Today, 5:00 PM IST" (snooze-aware) */
export const whenText = (r: Reminder) => fmtWhen(effectiveDue(r));

/** quick reschedule slots in IST */
export function rescheduleSlots(now: number): { label: string; due: number }[] {
  const { date, time } = epochToZoned(now, TZ);
  const at = (d: string, t: string) => zonedToEpoch(d, t, TZ);
  const slots = [{ label: 'In 1 hour', due: Math.ceil((now + 3600_000) / 900_000) * 900_000 }];
  if (time < '19:00') slots.push({ label: 'Tonight 8 PM', due: at(date, '20:00') });
  slots.push({ label: 'Tomorrow 10 AM', due: at(addDays(date, 1), '10:00') });
  const toMon = (8 - weekday(date)) % 7 || 7;
  slots.push({ label: 'Next Monday 10 AM', due: at(addDays(date, toMon), '10:00') });
  return slots;
}
