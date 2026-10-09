import { epochToZoned, zonedToEpoch } from '@akaya/tz';
import { describe, expect, it } from 'vitest';
import {
  alertLabel,
  alertTimes,
  CATEGORIES,
  complete,
  countByView,
  filterReminders,
  findDuplicate,
  makeFollowUp,
  mergeReminders,
  nextDue,
  nextDueAfter,
  reminderView,
  repeatLabel,
  reschedule,
  rollMissed,
  snooze,
  sortReminders,
  streakDays,
  suggestFollowUp,
  templateDue,
  type Reminder,
} from '../src/index.js';

const TZ = 'Asia/Kolkata';
const at = (date: string, time: string) => zonedToEpoch(date, time, TZ);
const NOW = at('2026-10-09', '12:00');
const MIN = 60_000;
let n = 0;
const r = (o: Partial<Reminder> = {}): Reminder => ({
  id: `r${++n}`,
  title: 'Call Rahul',
  category: 'work',
  priority: 'normal',
  due: NOW + 60 * MIN,
  alerts: [0],
  repeat: { kind: 'none' },
  status: 'pending',
  createdAt: NOW - 86400_000,
  source: 'form',
  ...o,
});
const zoned = (t: number) => epochToZoned(t, TZ);

describe('views and sorting', () => {
  it('upcoming / missed (after 15 min grace) / completed', () => {
    expect(reminderView(r(), NOW)).toBe('upcoming');
    expect(reminderView(r({ due: NOW - 10 * MIN }), NOW)).toBe('upcoming');
    expect(reminderView(r({ due: NOW - 20 * MIN }), NOW)).toBe('missed');
    expect(reminderView(r({ due: NOW - 20 * MIN, snoozedUntil: NOW + 5 * MIN }), NOW)).toBe('upcoming');
    expect(reminderView(r({ status: 'done' }), NOW)).toBe('completed');
  });
  it('sort by time or priority', () => {
    const a = r({ id: 'a', due: NOW + 2 * 3600_000, priority: 'urgent' });
    const b = r({ id: 'b', due: NOW + 3600_000, priority: 'low' });
    const c = r({ id: 'c', due: NOW + 3600_000, priority: 'high' });
    expect(sortReminders([a, b, c], 'upcoming').map((x) => x.id)).toEqual(['c', 'b', 'a']);
    expect(sortReminders([a, b, c], 'upcoming', 'priority').map((x) => x.id)).toEqual(['a', 'c', 'b']);
  });
  it('counts', () => {
    expect(countByView([r(), r({ status: 'done' }), r({ due: NOW - 3600_000 })], NOW)).toEqual({
      upcoming: 1,
      completed: 1,
      missed: 1,
    });
  });
});

describe('repeats', () => {
  const due = at('2026-01-31', '09:00');
  it('daily / weekly / monthly (clamped) / yearly / custom', () => {
    expect(zoned(nextDue({ due, repeat: { kind: 'daily' } })!)).toEqual({ date: '2026-02-01', time: '09:00' });
    expect(zoned(nextDue({ due, repeat: { kind: 'weekly' } })!).date).toBe('2026-02-07');
    expect(zoned(nextDue({ due, repeat: { kind: 'monthly' } })!).date).toBe('2026-02-28');
    expect(zoned(nextDue({ due, repeat: { kind: 'yearly' } })!).date).toBe('2027-01-31');
    expect(zoned(nextDue({ due, repeat: { kind: 'custom', everyDays: 10 } })!).date).toBe('2026-02-10');
    expect(nextDue({ due, repeat: { kind: 'none' } })).toBeNull();
  });
  it('weekly on weekdays (Sat 31 Jan → Mon 2 Feb)', () => {
    expect(zoned(nextDue({ due, repeat: { kind: 'weekly', weekdays: [1, 3, 5] } })!).date).toBe('2026-02-02');
  });
  it('nextDueAfter skips occurrences missed while closed', () => {
    expect(zoned(nextDueAfter({ due, repeat: { kind: 'daily' } }, at('2026-02-10', '10:00'))!).date).toBe('2026-02-11');
  });
  it('completing a repeating reminder spawns the next occurrence', () => {
    const daily = r({ due: at('2026-10-09', '09:00'), repeat: { kind: 'daily' } });
    const { done, next } = complete(daily, NOW, () => 'next-1');
    expect(done.status).toBe('done');
    expect(done.repeat.kind).toBe('none');
    expect(next!.id).toBe('next-1');
    expect(zoned(next!.due)).toEqual({ date: '2026-10-10', time: '09:00' });
    expect(next!.repeat.kind).toBe('daily');
    expect(complete(r(), NOW, () => 'x').next).toBeUndefined();
  });
  it('labels', () => {
    expect(repeatLabel(r({ repeat: { kind: 'weekly', weekdays: [1, 2, 3, 4, 5] } }))).toBe('Weekdays');
    expect(repeatLabel(r({ repeat: { kind: 'weekly', weekdays: [1, 4] } }))).toBe('Every Mon, Thu');
    expect(repeatLabel(r({ repeat: { kind: 'custom', everyDays: 90 } }))).toBe('Every 90 days');
  });
});

describe('alerts, snooze, reschedule', () => {
  it('multiple alerts: 1 day, 1 hour before and at time', () => {
    const x = r({ due: at('2026-10-12', '10:00'), alerts: [1440, 60, 0] });
    expect(alertTimes(x, NOW).map((t) => zoned(t))).toEqual([
      { date: '2026-10-11', time: '10:00' },
      { date: '2026-10-12', time: '09:00' },
      { date: '2026-10-12', time: '10:00' },
    ]);
    expect(alertTimes(x, at('2026-10-12', '09:30'))).toHaveLength(1);
    expect(alertTimes({ ...x, status: 'done' }, NOW)).toEqual([]);
  });
  it('snooze 5/10/15/30 adds an alert at now + n', () => {
    for (const m of [5, 10, 15, 30]) {
      const s = snooze(r({ due: NOW - 30 * MIN }), m, NOW);
      expect(s.snoozedUntil).toBe(NOW + m * MIN);
      expect(alertTimes(s, NOW)).toContain(NOW + m * MIN);
      expect(reminderView(s, NOW)).toBe('upcoming');
    }
  });
  it('reschedule clears snooze and done', () => {
    const x = reschedule(r({ status: 'done', doneAt: NOW, snoozedUntil: NOW }), NOW + 86400_000);
    expect(x).toMatchObject({ status: 'pending', due: NOW + 86400_000, snoozedUntil: undefined, doneAt: undefined });
  });
  it('alert labels', () => {
    expect([0, 10, 60, 1440, 2880, 10080].map(alertLabel)).toEqual([
      'At time',
      '10 min before',
      '1 h before',
      '1 day before',
      '2 days before',
      '1 week before',
    ]);
  });
});

describe('smart follow-up', () => {
  const missed = r({ due: NOW - 3600_000 });
  it('normal at noon → today 2 PM', () => {
    const f = suggestFollowUp(missed, NOW);
    expect(zoned(f.due)).toEqual({ date: '2026-10-09', time: '14:00' });
    expect(f.reason).toBe('You missed this');
  });
  it('urgent → in 15 min; high → in 1 hour; late evening → tomorrow 10 AM', () => {
    expect(suggestFollowUp({ ...missed, priority: 'urgent' }, NOW).due).toBe(NOW + 15 * MIN);
    expect(suggestFollowUp({ ...missed, priority: 'high' }, NOW).due).toBe(NOW + 60 * MIN);
    const late = at('2026-10-09', '21:30');
    expect(zoned(suggestFollowUp(missed, late).due)).toEqual({ date: '2026-10-10', time: '10:00' });
  });
  it('makeFollowUp links back', () => {
    const f = makeFollowUp(missed, suggestFollowUp(missed, NOW), 'f1', NOW);
    expect(f).toMatchObject({
      id: 'f1',
      followUpOf: missed.id,
      source: 'follow-up',
      status: 'pending',
      repeat: { kind: 'none' },
    });
  });
});

describe('duplicates', () => {
  const existing = r({ id: 'e', title: 'Call Rahul', due: at('2026-10-09', '17:00') });
  it('fuzzy title within 2 hours', () => {
    expect(findDuplicate({ title: 'call rahul!', due: at('2026-10-09', '18:00') }, [existing])?.reminder.id).toBe('e');
    expect(findDuplicate({ title: 'Cal Rahul', due: at('2026-10-09', '17:30') }, [existing])?.reminder.id).toBe('e');
    expect(
      findDuplicate({ title: 'Call Rahul about the invoice', due: at('2026-10-09', '17:00') }, [existing]),
    ).not.toBeNull();
  });
  it('not a duplicate: other title, far time, done, or itself', () => {
    expect(findDuplicate({ title: 'Call Neha', due: at('2026-10-09', '17:00') }, [existing])).toBeNull();
    expect(findDuplicate({ title: 'Call Rahul', due: at('2026-10-12', '17:00') }, [existing])).toBeNull();
    expect(findDuplicate({ title: 'Call Rahul', due: existing.due }, [{ ...existing, status: 'done' }])).toBeNull();
    expect(findDuplicate({ id: 'e', title: 'Call Rahul', due: existing.due }, [existing])).toBeNull();
  });
  it('same title same day counts even hours apart', () => {
    expect(findDuplicate({ title: 'Call Rahul', due: at('2026-10-09', '09:00') }, [existing])).not.toBeNull();
  });
  it('merge keeps the id, takes the new time, unions alerts, higher priority', () => {
    const { id: _id, ...incoming } = r({
      title: 'Call Rahul',
      due: at('2026-10-09', '18:00'),
      alerts: [60],
      priority: 'urgent',
    });
    const m = mergeReminders({ ...existing, alerts: [0] }, incoming);
    expect(m).toMatchObject({ id: 'e', due: at('2026-10-09', '18:00'), alerts: [60, 0], priority: 'urgent' });
  });
});

describe('dashboard queries', () => {
  const list = [
    r({ id: 'm', title: 'Take medicine', category: 'health', priority: 'high' }),
    r({ id: 'b', title: 'Electricity bill', category: 'finance', notes: 'BESCOM' }),
    r({ id: 'd', title: 'Gym', category: 'personal', status: 'done', doneAt: NOW }),
  ];
  it('filters by view, category, priority, search, date', () => {
    expect(filterReminders(list, { view: 'upcoming' }, NOW).map((x) => x.id)).toEqual(['m', 'b']);
    expect(filterReminders(list, { category: 'finance' }, NOW).map((x) => x.id)).toEqual(['b']);
    expect(filterReminders(list, { priority: 'high' }, NOW).map((x) => x.id)).toEqual(['m']);
    expect(filterReminders(list, { q: 'bescom' }, NOW).map((x) => x.id)).toEqual(['b']);
    expect(filterReminders(list, { date: '2026-10-10' }, NOW)).toEqual([]);
  });
  it('streak counts consecutive IST days', () => {
    const done = (d: string) => r({ status: 'done', doneAt: at(d, '08:00') });
    expect(streakDays([done('2026-10-09'), done('2026-10-08'), done('2026-10-07'), done('2026-10-05')], NOW)).toBe(3);
    expect(streakDays([done('2026-10-08'), done('2026-10-07')], NOW)).toBe(2);
    expect(streakDays([done('2026-10-06')], NOW)).toBe(0);
  });
  it('templateDue: today if ahead, else tomorrow, or inDays', () => {
    expect(zoned(templateDue('18:00', NOW))).toEqual({ date: '2026-10-09', time: '18:00' });
    expect(zoned(templateDue('09:00', NOW))).toEqual({ date: '2026-10-10', time: '09:00' });
    expect(zoned(templateDue('10:00', NOW, 3)).date).toBe('2026-10-12');
  });
  it('every category except General has 4 quick-add templates', () => {
    expect(CATEGORIES.filter((c) => c.id !== 'general').every((c) => c.templates.length === 4)).toBe(true);
    expect(CATEGORIES).toHaveLength(8);
  });
});

describe('rollMissed', () => {
  it('a missed daily reminder keeps the missed occurrence and continues tomorrow', () => {
    const x = r({ due: at('2026-10-09', '09:00'), repeat: { kind: 'daily' } });
    const { missed, next } = rollMissed(x, NOW, () => 'n2');
    expect(missed.repeat.kind).toBe('none');
    expect(reminderView(missed, NOW)).toBe('missed');
    expect(zoned(next!.due)).toEqual({ date: '2026-10-10', time: '09:00' });
    expect(next!.repeat.kind).toBe('daily');
  });
  it('no-op for one-off or not-yet-missed reminders', () => {
    expect(rollMissed(r({ due: NOW - 3600_000 }), NOW, () => 'x').next).toBeUndefined();
    expect(rollMissed(r({ repeat: { kind: 'daily' } }), NOW, () => 'x').next).toBeUndefined();
  });
});
