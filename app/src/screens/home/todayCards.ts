/** Data for the Home "Today" slider: one card per area, each linking to its filtered view. */
import type { IconName } from '@akaya/ui';
import {
  effectiveDue,
  filterReminders,
  reminderView,
  sortReminders,
  streakDays,
  type CategoryId,
  type Reminder,
} from '@akaya/reminders';
import { epochToZoned, fmtWhen } from '@akaya/tz';
import type { AppState } from '../../state/types';
import { fmtTime } from '../../lib/time';

const TZ = 'Asia/Kolkata';

export interface TodayCard {
  id: string;
  label: string;
  icon: IconName;
  tone: 'orange' | 'blue' | 'green' | 'pink' | 'violet' | 'cyan' | 'red';
  count: number;
  /** "due today", "this month" … */
  unit: string;
  items: { title: string; sub: string }[];
  empty: string;
  to: string;
  /** 0..1 progress bar (health, habits) */
  progress?: number;
  /** big badge text (streak) */
  badge?: string;
}

const short = (ts: number, now: number) => fmtWhen(ts, TZ, now).replace(' IST', '').replace('Today, ', '');
const rows = (list: Reminder[], now: number, n = 2) =>
  list.slice(0, n).map((r) => ({ title: r.title, sub: short(effectiveDue(r), now) }));

export function todayCards(s: AppState, now = Date.now()): TodayCard[] {
  const today = epochToZoned(now, TZ).date;
  const R = s.reminders;
  const upcoming = (category?: CategoryId) =>
    sortReminders(filterReminders(R, { view: 'upcoming', category }, now), 'upcoming');
  const dueToday = upcoming().filter((r) => epochToZoned(effectiveDue(r), TZ).date === today);
  const ofToday = (category: CategoryId) => filterReminders(R, { category, date: today }, now);
  const missed = sortReminders(filterReminders(R, { view: 'missed' }, now), 'missed');
  const days = (n: number) => now + n * 86400_000;

  const health = ofToday('health');
  const healthDone = health.filter((r) => r.status === 'done').length;
  const habits = ofToday('personal');
  const habitsDone = habits.filter((r) => r.status === 'done').length;
  const streak = streakDays(
    R.filter((r) => r.category === 'personal'),
    now,
  );
  const bills = upcoming('finance').filter((r) => effectiveDue(r) <= days(30));
  const dates = upcoming('dates').filter((r) => effectiveDue(r) <= days(60));
  const cal = s.today.filter((t) => t.kind === 'calendar' && !t.done).sort((a, b) => a.time - b.time);
  const follow = [
    ...s.today.filter((t) => t.kind === 'followup' && !t.done).map((t) => ({ title: t.title, at: t.time })),
    ...R.filter((r) => r.source === 'follow-up' && reminderView(r, now) === 'upcoming').map((r) => ({
      title: r.title,
      at: effectiveDue(r),
    })),
  ].sort((a, b) => a.at - b.at);
  const future = s.future.filter((m) => m.status === 'scheduled').sort((a, b) => a.when - b.when);

  return [
    {
      id: 'reminders',
      label: 'Reminders',
      icon: 'alarm',
      tone: 'orange',
      count: dueToday.length,
      unit: 'due today',
      items: rows(dueToday, now),
      empty: 'Nothing due today',
      to: '/reminders?day=today',
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: 'cal',
      tone: 'blue',
      count: cal.length,
      unit: 'events',
      items: cal.slice(0, 2).map((t) => ({ title: t.title, sub: fmtTime(t.time) })),
      empty: 'No events today',
      to: '/home?sheet=today&kind=calendar',
    },
    {
      id: 'followups',
      label: 'Follow-ups',
      icon: 'follow',
      tone: 'green',
      count: follow.length,
      unit: 'to follow up',
      items: follow.slice(0, 2).map((f) => ({ title: f.title, sub: short(f.at, now) })),
      empty: 'All caught up',
      to: '/home?sheet=today&kind=followup',
    },
    {
      id: 'health',
      label: 'Medicine & water',
      icon: 'pill',
      tone: 'pink',
      count: health.length - healthDone,
      unit: 'left today',
      items: rows(
        upcoming('health').filter((r) => epochToZoned(effectiveDue(r), TZ).date === today),
        now,
      ),
      empty: healthDone ? 'All doses done ✓' : 'Nothing scheduled',
      to: '/reminders?category=health',
      progress: health.length ? healthDone / health.length : undefined,
    },
    {
      id: 'bills',
      label: 'Bills & EMI',
      icon: 'wallet',
      tone: 'violet',
      count: bills.length,
      unit: 'in 30 days',
      items: rows(bills, now),
      empty: 'No bills due',
      to: '/reminders?category=finance',
    },
    {
      id: 'dates',
      label: 'Birthdays & dates',
      icon: 'gift',
      tone: 'cyan',
      count: dates.length,
      unit: 'coming up',
      items: rows(dates, now),
      empty: 'No dates soon',
      to: '/reminders?category=dates',
    },
    {
      id: 'habits',
      label: 'Habits & goals',
      icon: 'flame',
      tone: 'orange',
      count: habitsDone,
      unit: `of ${habits.length} done today`,
      items: rows(upcoming('personal'), now),
      empty: 'Add a daily goal',
      to: '/reminders?category=personal',
      progress: habits.length ? habitsDone / habits.length : undefined,
      badge: streak ? `${streak}-day streak` : undefined,
    },
    {
      id: 'future',
      label: 'Future Messages',
      icon: 'future',
      tone: 'blue',
      count: future.length,
      unit: 'scheduled',
      items: future.slice(0, 2).map((m) => ({ title: `To ${m.to}`, sub: short(m.when, now) })),
      empty: 'Nothing scheduled',
      to: '/future',
    },
    {
      id: 'missed',
      label: 'Missed',
      icon: 'alert',
      tone: 'red',
      count: missed.length,
      unit: 'missed',
      items: rows(missed, now),
      empty: 'Nothing missed 🎉',
      to: '/reminders?view=missed',
    },
  ];
}
