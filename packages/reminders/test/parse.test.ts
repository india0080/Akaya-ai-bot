import { zonedToEpoch } from '@akaya/tz';
import { describe, expect, it } from 'vitest';
import { isReminderRequest, parseReminder } from '../src/index.js';

const TZ = 'Asia/Kolkata';
// Friday 9 Oct 2026, 8:00 AM IST
const NOW = zonedToEpoch('2026-10-09', '08:00', TZ);
const at = (date: string, time: string) => zonedToEpoch(date, time, TZ);
const p = (s: string, now = NOW) => parseReminder(s, { now, tz: TZ });

describe('parseReminder: Hindi (Devanagari)', () => {
  it('the headline example', () => {
    const r = p('Hey Akaya, कल सुबह 10 बजे मीटिंग याद दिलाना');
    expect(r.title).toBe('Meeting');
    expect(r.due).toBe(at('2026-10-10', '10:00'));
    expect(r.category).toBe('work');
    expect(r.priority).toBe('normal');
    expect(r.repeat).toEqual({ kind: 'none' });
  });
  it('परसों शाम 5 बजे', () => {
    const r = p('परसों शाम 5 बजे प्रिया को कॉल करना');
    expect(r.due).toBe(at('2026-10-11', '17:00'));
    expect(r.title).toBe('प्रिया को कॉल करना');
  });
  it('आज रात 9 बजे दवा, हर रोज़', () => {
    const r = p('हर रोज़ रात 9 बजे दवा याद दिलाना');
    expect(r.repeat).toEqual({ kind: 'daily' });
    expect(r.due).toBe(at('2026-10-09', '21:00'));
    expect(r.title).toBe('Medicine');
    expect(r.category).toBe('health');
  });
  it('आज दोपहर 2 बजे + ज़रूरी', () => {
    const r = p('आज दोपहर 2 बजे बिजली का बिल भरना ज़रूरी है');
    expect(r.due).toBe(at('2026-10-09', '14:00'));
    expect(r.priority).toBe('urgent');
    expect(r.category).toBe('finance');
    expect(r.title).toBe('बिजली का बिल भरना');
  });
  it('Devanagari digits and साढ़े', () => {
    expect(p('कल साढ़े ८ बजे सुबह योगा').due).toBe(at('2026-10-10', '08:30'));
  });
  it('2 घंटे बाद', () => {
    expect(p('2 घंटे बाद पानी पीना').due).toBe(NOW + 2 * 3600_000);
    expect(p('2 घंटे बाद पानी पीना').title).toBe('Drink water');
  });
});

describe('parseReminder: Hinglish', () => {
  it('kal subah 10 baje', () => {
    const r = p('kal subah 10 baje meeting yaad dilana');
    expect(r.due).toBe(at('2026-10-10', '10:00'));
    expect(r.title).toBe('Meeting');
  });
  it("'5 baje' with no part of day means 5 PM", () => {
    expect(p('5 baje Rahul ko call karna').due).toBe(at('2026-10-09', '17:00'));
  });
  it('raat 2 baje stays early morning, rolling to the next day when passed', () => {
    expect(p('raat 2 baje flight check-in').due).toBe(at('2026-10-10', '02:00'));
  });
  it('har roz shaam 7 baje walk', () => {
    const r = p('har roz shaam 7 baje walk');
    expect(r.repeat.kind).toBe('daily');
    expect(r.due).toBe(at('2026-10-09', '19:00'));
    expect(r.category).toBe('personal');
  });
  it('parso, sava/paune, dedh', () => {
    expect(p('parso sava 4 baje').due).toBe(at('2026-10-11', '16:15'));
    expect(p('paune 10 baje subah standup').due).toBe(at('2026-10-09', '09:45'));
    expect(p('kal dedh baje lunch').due).toBe(at('2026-10-10', '13:30'));
  });
  it('har somvar + zaroori', () => {
    const r = p('har somvar subah 9 baje team meeting, zaroori');
    expect(r.repeat).toEqual({ kind: 'weekly', weekdays: [1] });
    expect(r.due).toBe(at('2026-10-12', '09:00'));
    expect(r.priority).toBe('urgent');
    expect(r.title).toBe('Team meeting');
  });
  it('30 minute baad', () => {
    expect(p('30 minute baad chai').due).toBe(NOW + 30 * 60_000);
  });
  it('5 tarikh har mahine EMI', () => {
    const r = p('har mahine 5 tarikh ko home loan EMI');
    expect(r.repeat.kind).toBe('monthly');
    expect(r.due).toBe(at('2026-11-05', '09:00'));
    expect(r.category).toBe('finance');
    expect(r.title).toBe('Home loan EMI');
  });
});

describe('parseReminder: English', () => {
  it('every Monday', () => {
    const r = p('every Monday 8 am gym');
    expect(r.repeat).toEqual({ kind: 'weekly', weekdays: [1] });
    expect(r.due).toBe(at('2026-10-12', '08:00'));
    expect(r.title).toBe('Gym');
  });
  it('in 2 hours', () => {
    const r = p('remind me in 2 hours to call Rahul');
    expect(r.due).toBe(NOW + 2 * 3600_000);
    expect(r.title).toBe('Call Rahul');
  });
  it('in 45 mins / in an hour / in 3 days', () => {
    expect(p('in 45 mins stretch').due).toBe(NOW + 45 * 60_000);
    expect(p('in an hour check oven').due).toBe(NOW + 3600_000);
    expect(p('in 3 days renew pass').due).toBe(NOW + 3 * 86400_000);
  });
  it('dates: 25 Dec, Dec 25, 25/12, ISO, ordinals', () => {
    const xmas = at('2026-12-25', '09:00');
    expect(p("Neha's anniversary on 25 Dec").due).toBe(xmas);
    expect(p('December 25 gift shopping').due).toBe(xmas);
    expect(p('25/12 party').due).toBe(xmas);
    expect(p('2026-12-25 party').due).toBe(xmas);
    expect(p('on the 3rd of January passport').due).toBe(at('2027-01-03', '09:00'));
    expect(p("Neha's anniversary on 25 Dec").category).toBe('dates');
  });
  it('tomorrow at 7:30 pm, urgent', () => {
    const r = p('Remind me to pay the credit card bill tomorrow at 7:30 pm, urgent');
    expect(r.due).toBe(at('2026-10-10', '19:30'));
    expect(r.priority).toBe('urgent');
    expect(r.title).toBe('Pay the credit card bill');
    expect(r.category).toBe('finance');
  });
  it('a time already gone today rolls to tomorrow; a stated today does not', () => {
    expect(p('7 am yoga').due).toBe(at('2026-10-10', '07:00'));
    expect(p('today 7 am yoga').due).toBe(at('2026-10-09', '07:00'));
  });
  it('a weekday named on the same weekday: today if ahead, next week if passed', () => {
    expect(p('Friday 6 pm movie').due).toBe(at('2026-10-09', '18:00'));
    expect(p('Friday 7 am run').due).toBe(at('2026-10-16', '07:00'));
    expect(p('next Friday 6 pm movie').due).toBe(at('2026-10-16', '18:00'));
  });
  it('repeat rules', () => {
    expect(p('water plants every 3 days').repeat).toEqual({ kind: 'custom', everyDays: 3 });
    expect(p('weekdays 9:15 am standup').repeat).toEqual({ kind: 'weekly', weekdays: [1, 2, 3, 4, 5] });
    expect(p('rent monthly on the 1st').repeat.kind).toBe('monthly');
    expect(p("Priya's birthday every year on 14 Feb").repeat.kind).toBe('yearly');
    expect(p('every day at 10 pm read').repeat.kind).toBe('daily');
  });
  it('priority words', () => {
    expect(p('urgent call the bank').priority).toBe('urgent');
    expect(p('important: submit report by 5 pm').priority).toBe('high');
    expect(p('low priority clean desk').priority).toBe('low');
  });
  it('numbers that are not times stay in the title', () => {
    const r = p('read 20 pages tonight');
    expect(r.title).toBe('Read 20 pages');
    expect(r.due).toBe(at('2026-10-09', '21:00'));
  });
  it('amounts stay in the title', () => {
    const r = p('Pay electricity bill ₹1,240 tomorrow at 7 pm, important');
    expect(r.title).toBe('Pay electricity bill ₹1,240');
    expect(r.due).toBe(at('2026-10-10', '19:00'));
    expect(r.priority).toBe('high');
    expect(r.category).toBe('finance');
  });
  it('no date or time → due null (the UI asks)', () => {
    const r = p('buy milk');
    expect(r.due).toBeNull();
    expect(r.title).toBe('Buy milk');
  });
  it('category templates fall back to a title', () => {
    expect(p('remind me tomorrow').title).toBe('Reminder');
  });
});

describe('isReminderRequest', () => {
  it.each([
    'Remind me to call Rahul at 5',
    'Hey Akaya, कल सुबह 10 बजे मीटिंग याद दिलाना',
    'kal 9 baje dawai yaad dila dena',
    'set a reminder for the EMI',
    'mujhe yaad karana parso',
  ])('yes: %s', (s) => expect(isReminderRequest(s)).toBe(true));
  it.each(['Plan my weekend', 'Swiggy se biryani', 'Translate thank you to Hindi', 'I remember that song'])(
    'no: %s',
    (s) => expect(isReminderRequest(s)).toBe(false),
  );
});
