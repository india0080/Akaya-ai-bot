/**
 * Natural-language reminder parser: English, Hinglish (Roman Hindi) and Hindi (Devanagari).
 *
 *   'Hey Akaya, कल सुबह 10 बजे मीटिंग याद दिलाना' → { title: 'Meeting', due: tomorrow 10:00 IST }
 *   'har roz raat 9 baje dawai'                 → daily 21:00 'Medicine'
 *   'remind me to pay the credit card bill on the 5th every month, urgent'
 *
 * Deterministic, offline, no model calls. Everything it recognises is removed from the text; what remains is the title.
 */
import { epochToZoned, zonedToEpoch } from '@akaya/tz';
import { CATEGORIES } from './categories.js';
import { addDays, daysInMonth, hhmm, splitDate, weekday, ymd } from './dates.js';
import type { CategoryId, Priority, Repeat } from './types.js';

export interface ParsedReminder {
  title: string;
  /** epoch ms, or null when the text has no date/time at all (the UI then asks) */
  due: number | null;
  repeat: Repeat;
  priority: Priority;
  category: CategoryId;
  /** the phrases that were understood, for the preview chips ("कल", "सुबह 10 बजे", "हर रोज़") */
  understood: string[];
}

export interface ParseOptions {
  now?: number;
  tz?: string;
  /** time used when only a day is given (default 09:00) */
  defaultTime?: string;
}

/* ───────── matching helpers ───────── */

const L = '[\\p{L}\\p{M}\\p{N}]';
/** whole-word regex that also works for Devanagari (JS \b does not) */
const W = (src: string, flags = 'iu') => new RegExp(`(?<!${L})(?:${src})(?!${L})`, flags);

const DEV_DIGITS = '०१२३४५६७८९';
function normalise(text: string): string {
  return text
    .replace(/[०-९]/g, (d) => String(DEV_DIGITS.indexOf(d)))
    .replace(/\u093C/g, '') // nukta: ज़ → ज, ढ़ → ढ
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

class Cursor {
  constructor(public text: string) {}
  understood: string[] = [];
  /** find + cut the first match; returns it (or null) */
  take(re: RegExp): RegExpExecArray | null {
    const m = re.exec(this.text);
    if (!m) return null;
    this.text = (this.text.slice(0, m.index) + ' ' + this.text.slice(m.index + m[0].length))
      .replace(/\s+/g, ' ')
      .trim();
    this.understood.push(m[0].trim());
    return m;
  }
  /** cut the first match that satisfies `ok` (re must be global) */
  takeWhere(re: RegExp, ok: (m: RegExpExecArray) => boolean): RegExpExecArray | null {
    re.lastIndex = 0;
    for (let m = re.exec(this.text); m; m = re.exec(this.text)) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      if (!ok(m)) continue;
      this.text = (this.text.slice(0, m.index) + ' ' + this.text.slice(m.index + m[0].length))
        .replace(/\s+/g, ' ')
        .trim();
      this.understood.push(m[0].trim());
      return m;
    }
    return null;
  }
  /** cut without recording it as understood (filler words) */
  drop(re: RegExp): void {
    this.text = this.text.replace(re, ' ').replace(/\s+/g, ' ').trim();
  }
}

/* ───────── vocab ───────── */

const FILLERS = [
  'hey akaya',
  'hi akaya',
  'ok akaya',
  'akaya',
  'हे अकाया',
  'अकाया',
  'please',
  'pls',
  'plz',
  'kripya',
  'कृपया',
  'remind me (?:to|about|that|of)',
  'remind me',
  'set (?:a )?reminder (?:to|for)',
  'set (?:a )?reminder',
  'add (?:a )?reminder (?:to|for)',
  'reminder (?:to|for)',
  'reminder',
  'rimaindar',
  "don'?t let me forget (?:to )?",
  '(?:mujhe )?yaa?d (?:dila(?:a)?na|dila(?:a)? dena|dila(?:a)?o|dila do|dilana|karana|kara dena)',
  '(?:मुझे )?याद (?:दिलाना|दिला देना|दिलाओ|दिलाएं|दिलाइए|दिला दो|कराना|करा देना)',
  'yaad rakhna',
  'याद रखना',
];

const PRIORITY_WORDS: [Priority, string][] = [
  [
    'urgent',
    'very urgent|urgent|urgently|asap|emergency|zaroori|zaruri|jaruri|jaroori|bahut zaroori|turant|जरूरी|बहुत जरूरी|तुरंत|अर्जेंट',
  ],
  ['high', 'high priority|important|imp|ahem|aham|अहम|महत्वपूर्ण'],
  ['low', 'low priority|not urgent|whenever|kabhi bhi|कभी भी'],
  ['normal', 'normal priority'],
];

const WEEKDAYS: string[] = [
  'sunday|sun|ravivar|raviwar|itwar|itvaar|रविवार|इतवार',
  'monday|mon|somvar|somwar|सोमवार',
  'tuesday|tue|tues|mangalvar|mangalwar|मंगलवार',
  'wednesday|wed|budhvar|budhwar|बुधवार',
  'thursday|thu|thurs|guruvar|guruwar|brihaspativar|गुरुवार|बृहस्पतिवार',
  'friday|fri|shukravar|shukrawar|शुक्रवार',
  'saturday|sat|shanivar|shaniwar|शनिवार',
];
const WEEKDAY_ANY = WEEKDAYS.join('|');
const weekdayIndex = (word: string) => WEEKDAYS.findIndex((alts) => W(alts).test(word));

const MONTHS = [
  'january|jan|जनवरी',
  'february|feb|फरवरी',
  'march|mar|मार्च',
  'april|apr|अप्रैल',
  'may|मई',
  'june|jun|जून',
  'july|jul|जुलाई',
  'august|aug|अगस्त',
  'september|sept|sep|सितंबर|सितम्बर',
  'october|oct|अक्टूबर',
  'november|nov|नवंबर|नवम्बर',
  'december|dec|दिसंबर|दिसम्बर',
];
const MONTH_ANY = MONTHS.join('|');
const monthIndex = (word: string) => MONTHS.findIndex((alts) => W(alts).test(word)) + 1;

const EVERY = 'every|each|har|हर|प्रत्येक';
const DAILY =
  'daily|every ?day|everyday|each day|har ?roz|har ?din|roz(?:ana)?|rozaana|har subah|हर रोज|हर दिन|रोज|रोजाना|प्रतिदिन';

type Part = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
const PARTS: [Part, string, number][] = [
  // part, words, default hour
  ['morning', 'subah|subeh|savere|savera|सुबह|सवेरे|morning|in the morning', 9],
  ['noon', 'dopahar|dopaher|दोपहर|afternoon|noon', 13],
  ['evening', 'shaam|sham|शाम|evening|in the evening', 18],
  ['night', 'raat|rat|रात|night|at night|tonight', 21],
];

/** fractional prefixes: saadhe 5 = 5:30, sava 5 = 5:15, paune 5 = 4:45 */
const FRACTIONS: [string, (h: number) => [number, number]][] = [
  ['saa?dhe|sadhe|साढे', (h) => [h, 30]],
  ['sava|savaa|sawa|सवा', (h) => [h, 15]],
  ['paune|paone|पौने', (h) => [h - 1, 45]],
];
const FRACTION_ANY = FRACTIONS.map((f) => f[0]).join('|');

/** single-word Hindi/Hinglish titles → friendly English title */
const TITLE_WORDS: Record<string, string> = {
  मीटिंग: 'Meeting',
  meeting: 'Meeting',
  दवा: 'Medicine',
  दवाई: 'Medicine',
  dawai: 'Medicine',
  dawa: 'Medicine',
  davai: 'Medicine',
  goli: 'Medicine',
  पानी: 'Drink water',
  paani: 'Drink water',
  pani: 'Drink water',
  'paani peena': 'Drink water',
  'पानी पीना': 'Drink water',
  जन्मदिन: 'Birthday',
  व्यायाम: 'Exercise',
  vyayam: 'Exercise',
  padhai: 'Study',
  पढ़ाई: 'Study',
  पढाई: 'Study',
  'बिजली का बिल': 'Electricity bill',
  'bijli ka bill': 'Electricity bill',
  'bijli bill': 'Electricity bill',
  किराया: 'Rent',
  kiraya: 'Rent',
};

/** true when a chat / voice message asks for a reminder ("remind me…", "याद दिलाना", "yaad dila dena", "set a reminder") */
export function isReminderRequest(text: string): boolean {
  return W(
    'remind(?:er)?|remind me|reminders?|alarm|yaa?d (?:dila|kara|rakh)\\p{L}*|याद (?:दिला|करा|रख)[\\p{L}\\p{M}]*|rimaindar|रिमाइंडर',
  ).test(normalise(text));
}

/* ───────── parser ───────── */

export function parseReminder(input: string, opts: ParseOptions = {}): ParsedReminder {
  const tz = opts.tz ?? 'Asia/Kolkata';
  const now = opts.now ?? Date.now();
  const today = epochToZoned(now, tz).date;
  const nowTime = epochToZoned(now, tz).time;
  const c = new Cursor(normalise(input));

  // 1. fillers ("Hey Akaya", "remind me to", "याद दिलाना")
  for (const f of FILLERS) c.drop(W(f, 'giu'));
  c.drop(/^[\s,.:;!-]+|[\s,.:;!?-]+$/g);

  // 2. priority
  let priority: Priority = 'normal';
  for (const [p, words] of PRIORITY_WORDS) {
    if (c.take(W(`(?:${words})(?: hai| है)?`))) {
      priority = p;
      break;
    }
  }

  // 3. relative offsets: "in 2 hours", "2 ghante mein", "30 min baad", "aadhe ghante mein"
  let offsetMin: number | null = null;
  const UNIT_H = 'hours?|hrs?|h|ghante|ghanta|ghanton|घंटे|घंटा|घंटों';
  const UNIT_M = 'minutes?|mins?|m|minat|मिनट';
  const UNIT_D = 'days?|din|दिन';
  const AFTER = 'mein|me|men|baad|bad|में|बाद';
  const rel =
    c.take(W(`(?:in|after) (\\d+(?:\\.\\d+)?|an?|half an?) (${UNIT_H}|${UNIT_M}|${UNIT_D})`)) ??
    c.take(W(`(\\d+(?:\\.\\d+)?|aadhe|aadha|आधे|आधा|dedh|डेढ़|डेढ) (${UNIT_H}|${UNIT_M}|${UNIT_D}) (?:${AFTER})`));
  if (rel) {
    const raw = rel[1].toLowerCase();
    const n = /^(an?|1)$/.test(raw) ? 1 : /half|aadh|आध/.test(raw) ? 0.5 : /dedh|डेढ/.test(raw) ? 1.5 : Number(raw);
    const unit = rel[2];
    const per = W(UNIT_D).test(unit) ? 1440 : W(UNIT_H).test(unit) ? 60 : 1;
    offsetMin = Math.round(n * per);
  }

  // 4. repeat rules (before weekdays, so "every Monday" is not read as "next Monday")
  let repeat: Repeat = { kind: 'none' };
  let m: RegExpExecArray | null;
  if ((m = c.take(W(`(?:${EVERY}) (\\d+) (?:${UNIT_D})`)))) repeat = { kind: 'custom', everyDays: Number(m[1]) };
  else if (c.take(W(`(?:on )?weekdays|every weekday|monday to friday|mon-fri|somvar se shukravar|सोमवार से शुक्रवार`)))
    repeat = { kind: 'weekly', weekdays: [1, 2, 3, 4, 5] };
  else if ((m = c.take(W(`(?:${EVERY}) (${WEEKDAY_ANY})(?: (?:ko|को))?`))))
    repeat = { kind: 'weekly', weekdays: [weekdayIndex(m[1])] };
  else if (c.take(W(DAILY))) repeat = { kind: 'daily' };
  else if (c.take(W(`weekly|every week|har hafte|har hafta|हर हफ्ते|हर सप्ताह|साप्ताहिक`))) repeat = { kind: 'weekly' };
  else if (c.take(W(`monthly|every month|har mahine|har mahina|हर महीने|हर माह|मासिक`))) repeat = { kind: 'monthly' };
  else if (c.take(W(`yearly|annually|every year|har saal|har sal|हर साल|हर वर्ष|सालाना|वार्षिक`)))
    repeat = { kind: 'yearly' };
  // "हर सुबह" / "har shaam" → daily (the part of day stays for step 7)
  else if ((m = W(`(?:${EVERY}) (${PARTS.map((p) => p[1]).join('|')})`).exec(c.text))) {
    c.text = c.text.replace(m[0], m[1]);
    c.understood.push(m[0]);
    repeat = { kind: 'daily' };
  }

  // 5. explicit dates
  let date: string | null = null;
  const [ty, tm] = splitDate(today);
  const nextYmdOf = (mo: number, d: number, y?: number) => {
    if (y) return ymd(y < 100 ? 2000 + y : y, mo, d);
    const thisYear = ymd(ty, mo, d);
    return thisYear < today ? ymd(ty + 1, mo, d) : thisYear;
  };
  const ORD = '(?:st|nd|rd|th)?';
  if ((m = c.take(W(`(?:on )?(\\d{4})-(\\d{2})-(\\d{2})`)))) date = ymd(+m[1], +m[2], +m[3]);
  else if ((m = c.take(W(`(?:on )?(\\d{1,2})[/.-](\\d{1,2})(?:[/.-](\\d{2,4}))?`))))
    date = nextYmdOf(+m[2], +m[1], m[3] ? +m[3] : undefined);
  else if ((m = c.take(W(`(?:on )?(?:the )?(\\d{1,2})${ORD} (?:of )?(${MONTH_ANY})(?: (\\d{4}))?`))))
    date = nextYmdOf(monthIndex(m[2]), +m[1], m[3] ? +m[3] : undefined);
  else if ((m = c.take(W(`(?:on )?(${MONTH_ANY}) (\\d{1,2})${ORD}(?:,? (\\d{4}))?`))))
    date = nextYmdOf(monthIndex(m[1]), +m[2], m[3] ? +m[3] : undefined);
  else if ((m = c.take(W(`(?:on )?(?:the )?(\\d{1,2})(?:st|nd|rd|th| tarikh| tareekh| तारीख)(?: (?:ko|को))?`)))) {
    // day of month only: this month if still ahead, else next month
    const d = +m[1];
    const clamp = (y: number, mo: number) => ymd(y, mo, Math.min(d, daysInMonth(y, mo)));
    const cand = clamp(ty, tm);
    date = cand >= today ? cand : tm === 12 ? clamp(ty + 1, 1) : clamp(ty, tm + 1);
  }

  // 6. relative day words
  /** false when the day may roll forward if the time has already passed (no day said, or "Monday" on a Monday) */
  let dayFixed = date !== null;
  let rollDays = 1;
  if (!date) {
    dayFixed = true;
    if (c.take(W(`day after tomorrow|parso|parson|parsoon|परसों|परसो`))) date = addDays(today, 2);
    else if (c.take(W(`tomorrow|tmrw|tmr|kal|कल`))) date = addDays(today, 1);
    else if (c.take(W(`today|aaj|आज|tonight`))) {
      date = today;
      if (/tonight/i.test(c.understood.at(-1) ?? '')) c.text = `raat ${c.text}`;
    } else if ((m = c.take(W(`(?:(next|agle|अगले) )?(?:on )?(${WEEKDAY_ANY})(?: (?:ko|को))?`)))) {
      const wd = weekdayIndex(m[2]);
      let diff = (wd - weekday(today) + 7) % 7;
      if (m[1] && diff === 0) diff = 7;
      date = addDays(today, diff);
      if (diff === 0) [dayFixed, rollDays] = [false, 7]; // "Monday" said on a Monday: today if the time is ahead, else next week
    } else dayFixed = false;
  }
  if (!date && repeat.kind === 'weekly' && repeat.weekdays?.length) {
    // "every Monday" → the next Monday (today if it is Monday and the time is ahead)
    date = addDays(today, Math.min(...repeat.weekdays.map((wd) => (wd - weekday(today) + 7) % 7)));
  }

  // 7. time of day: "सुबह 10 बजे", "10 baje subah", "5:30 pm", "at 7", "saadhe 5", "dedh baje", "noon"
  let part: [Part, string, number] | undefined;
  for (const p of PARTS) {
    const pm = W(`(?:${p[1]})(?: (?:ko|को|me|mein|में|ke|के))?`).exec(c.text);
    if (pm) {
      // leave a marker: a bare number right next to it ("subah 10", "9 raat") is a time; "read 20 pages tonight" is not
      c.text = `${c.text.slice(0, pm.index)} § ${c.text.slice(pm.index + pm[0].length)}`.replace(/\s+/g, ' ').trim();
      c.understood.push(pm[0]);
      part = p;
      break;
    }
  }
  let hour: number | null = null;
  let minute = 0;
  let ampm: 'am' | 'pm' | null = null;
  const BAJE = "baje|bajey|bje|बजे|o'?clock";
  const AMPM = 'a\\.?m\\.?|p\\.?m\\.?';
  if ((m = c.take(W(`(?:at |@ ?)?(dedh|डेढ|dhai|dhaai|ढाई)(?: (?:${BAJE}))`)))) {
    [hour, minute] = /dedh|डेढ/.test(m[1]) ? [1, 30] : [2, 30];
  } else if (
    (m = c.takeWhere(
      W(
        `(?:§ )?(?:at |@ ?|by )?(?:(${FRACTION_ANY}) )?(\\d{1,2})(?:[:.](\\d{2}))? ?(${AMPM})?(?: (${BAJE}))?(?: (?:ko|को|tak|तक))?(?: §)?`,
        'giu',
      ),
      // a bare number ("Read 20 pages") is not a time unless something marks it as one
      (x) =>
        +x[2] <= 24 && Boolean(/^(?:§ )?(at |@|by )/i.test(x[0]) || x[1] || x[3] || x[4] || x[5] || x[0].includes('§')),
    ))
  ) {
    hour = +m[2];
    minute = m[3] ? +m[3] : 0;
    if (m[1]) [hour, minute] = FRACTIONS.find((f) => W(f[0]).test(m![1]))![1](hour);
    if (m[4]) ampm = /^a/i.test(m[4]) ? 'am' : 'pm';
  } else if (c.take(W(`noon|midday`))) hour = 12;
  else if (c.take(W(`midnight|आधी रात`))) [hour, ampm] = [0, 'am'];

  c.text = c.text.replace(/§/g, ' ').replace(/\s+/g, ' ').trim();
  c.understood = c.understood.map((u) => u.replace(/§/g, '').trim()).filter(Boolean);
  if (hour !== null) {
    if (ampm === 'pm' && hour < 12) hour += 12;
    else if (ampm === 'am' && hour === 12) hour = 0;
    else if (!ampm && part) {
      if (part[0] === 'morning' && hour === 12) hour = 0;
      if ((part[0] === 'afternoon' || part[0] === 'noon') && hour < 12 && hour >= 1) hour += 12;
      if (part[0] === 'evening' && hour < 12) hour += 12;
      if (part[0] === 'night' && hour < 12 && hour >= 5) hour += 12; // raat 9 → 21:00, raat 2 → 02:00
    } else if (!ampm && hour >= 1 && hour <= 6) hour += 12; // "5 baje" with no context → 5 PM (people rarely mean 5 AM)
  } else if (part) hour = part[2];

  // 8. category (from the full text, so "credit card bill" still counts after the title is cleaned)
  const lower = normalise(input).toLowerCase();
  const category: CategoryId =
    CATEGORIES.find((cat) => cat.keywords.some((k) => W(k.replace(/[-]/g, '[- ]?')).test(lower)))?.id ?? 'general';

  // 9. due instant
  let due: number | null = null;
  if (offsetMin !== null) due = now + offsetMin * 60000;
  else if (date || hour !== null || repeat.kind !== 'none') {
    const time = hour !== null ? hhmm(hour, minute) : (opts.defaultTime ?? '09:00');
    let d = date ?? today;
    if (!dayFixed && d === today && time <= nowTime) {
      // the time has already gone today: next matching day
      d =
        repeat.kind === 'weekly' && repeat.weekdays?.length
          ? nextWeekdayAfter(today, repeat.weekdays)
          : addDays(today, rollDays);
    }
    due = zonedToEpoch(d, time, tz);
  }

  return { title: cleanTitle(c.text, category), due, repeat, priority, category, understood: c.understood };
}

function nextWeekdayAfter(date: string, weekdays: number[]): string {
  for (let i = 1; i <= 7; i++) if (weekdays.includes(weekday(addDays(date, i)))) return addDays(date, i);
  return addDays(date, 7);
}

const EDGE_WORDS =
  'to|about|for|that|of|on|at|by|the|a|an|me|mein|में|ko|को|ka|ki|ke|का|की|के|se|से|pe|par|पर|and|aur|और|hai|है|tak|तक|ke liye|के लिए|liye|लिए';

function cleanTitle(rest: string, category: CategoryId): string {
  // drop separators, but keep "₹1,240", "Dr. Mehta", "check-in"
  let t = rest
    .replace(/[,;:!?]+(?!\d)/g, ' ')
    .replace(/\s[-–]\s/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.–-]+|[\s.–-]+$/g, '');
  const edge = new RegExp(`^(?:${EDGE_WORDS})(?!${L})\\s*|\\s*(?<!${L})(?:${EDGE_WORDS})$`, 'iu');
  for (let prev = ''; prev !== t;) {
    prev = t;
    t = t.replace(edge, '').trim();
  }
  const known = TITLE_WORDS[t.toLowerCase()];
  if (known) return known;
  if (!t) return category === 'general' ? 'Reminder' : (CATEGORIES.find((c) => c.id === category)?.label ?? 'Reminder');
  return t.charAt(0).toUpperCase() + t.slice(1);
}
