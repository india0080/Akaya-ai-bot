/** Sample reminders seeded for a new install (marked `sample: true`, shown with a Sample tag). Times in IST, relative to now. */
import { addDays, type CategoryId, type Priority, type Reminder, type Repeat } from '@akaya/reminders';
import { epochToZoned, zonedToEpoch } from '@akaya/tz';

const TZ = 'Asia/Kolkata';
const HOUR = 3600_000;

export function sampleReminders(now = Date.now()): Reminder[] {
  const today = epochToZoned(now, TZ).date;
  const on = (days: number, time: string) => zonedToEpoch(addDays(today, days), time, TZ);
  /** a time later today (rounded to 15 min) so "today" cards look alive; late at night it moves to tomorrow morning */
  const later = (hours: number) => {
    const t = Math.ceil((now + hours * HOUR) / (15 * 60_000)) * 15 * 60_000;
    return epochToZoned(t, TZ).date === today && epochToZoned(t, TZ).time <= '23:00'
      ? t
      : on(1, '08:00') + hours * HOUR;
  };
  let n = 0;
  const r = (
    title: string,
    category: CategoryId,
    priority: Priority,
    due: number,
    o: Partial<Reminder> & { repeat?: Repeat } = {},
  ): Reminder => ({
    id: `s${++n}`,
    title,
    category,
    priority,
    due,
    alerts: [10, 0],
    repeat: { kind: 'none' },
    status: 'pending',
    createdAt: now - 2 * 86400_000,
    source: 'form',
    sample: true,
    ...o,
  });
  const done = (at: number) => ({ status: 'done' as const, doneAt: at + 4 * 60_000 });

  return [
    // health
    r('Take BP medicine', 'health', 'urgent', later(1.5), { repeat: { kind: 'daily' }, alerts: [10, 0] }),
    r('Drink water', 'health', 'normal', later(0.75), { repeat: { kind: 'custom', everyDays: 1 }, alerts: [0] }),
    r('Vitamin D tablet', 'health', 'high', now - 5 * HOUR, done(now - 5 * HOUR)),
    r('Pick up medicines', 'health', 'normal', on(-1, '20:00')),
    r('Dr. Mehta checkup', 'health', 'high', on(5, '17:30'), { alerts: [1440, 60] }),
    // work
    r('Call Rahul about the invoice', 'work', 'high', later(2), { alerts: [15, 0], source: 'chat' }),
    r('Reply to Neha about Friday', 'work', 'normal', now - 2 * HOUR, { source: 'voice' }),
    r('Sales follow-up: Priya Traders', 'work', 'normal', on(1, '16:00'), {
      repeat: { kind: 'weekly', weekdays: [2, 4] },
    }),
    r('Project deadline', 'work', 'urgent', on(3, '18:00'), { alerts: [1440, 120, 0] }),
    // finance
    r('Pay electricity bill ₹1,240', 'finance', 'high', later(3), { alerts: [1440, 60, 0] }),
    r('Home loan EMI', 'finance', 'urgent', on(3, '09:00'), { repeat: { kind: 'monthly' }, alerts: [2880, 1440, 0] }),
    r('Credit card due', 'finance', 'urgent', on(6, '10:00'), { repeat: { kind: 'monthly' }, alerts: [4320, 1440, 0] }),
    r('Car insurance renewal', 'finance', 'normal', on(21, '11:00'), {
      repeat: { kind: 'yearly' },
      alerts: [10080, 1440],
    }),
    // important dates
    r("Priya's birthday", 'dates', 'high', on(4, '09:00'), { repeat: { kind: 'yearly' }, alerts: [1440, 0] }),
    r("Neha & Rahul's anniversary", 'dates', 'normal', on(12, '09:00'), {
      repeat: { kind: 'yearly' },
      alerts: [10080, 1440],
    }),
    r('Passport expiry', 'dates', 'high', on(75, '10:00'), { alerts: [43200, 10080] }),
    // family
    r('Baby vaccination (sample schedule)', 'family', 'urgent', on(9, '10:00'), { alerts: [2880, 1440, 60] }),
    r('School PTM', 'family', 'normal', on(1, '09:30'), { alerts: [1440, 60] }),
    // personal routine: a 5-day exercise streak plus today's goals
    ...[1, 2, 3, 4].map((d) => r('Morning exercise', 'personal', 'normal', on(-d, '07:00'), done(on(-d, '07:00')))),
    r('Morning exercise', 'personal', 'normal', now - 3 * HOUR, done(now - 3 * HOUR)),
    r('Morning exercise', 'personal', 'normal', on(1, '07:00'), { repeat: { kind: 'daily' }, alerts: [0] }),
    r('Study 1 hour', 'personal', 'normal', later(2.5), { repeat: { kind: 'daily' }, alerts: [0] }),
    // maintenance
    r('Car service', 'maintenance', 'normal', on(8, '10:00'), {
      repeat: { kind: 'custom', everyDays: 180 },
      alerts: [1440],
    }),
    r('Change RO filter', 'maintenance', 'low', on(15, '10:00'), {
      repeat: { kind: 'custom', everyDays: 90 },
      alerts: [0],
    }),
  ];
}
