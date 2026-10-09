/** @akaya/tz: time-zone helpers for scheduling (no dependencies; uses Intl). Used by the app and services/future-message. */
export const ZONES: { id: string; label: string }[] = [
  { id: 'Asia/Kolkata', label: 'IST · India' },
  { id: 'UTC', label: 'UTC' },
  { id: 'Asia/Dubai', label: 'GST · Dubai' },
  { id: 'Asia/Singapore', label: 'SGT · Singapore' },
  { id: 'Europe/London', label: 'UK · London' },
  { id: 'Europe/Berlin', label: 'CET · Berlin' },
  { id: 'America/New_York', label: 'ET · New York' },
  { id: 'America/Los_Angeles', label: 'PT · Los Angeles' },
  { id: 'Australia/Sydney', label: 'AET · Sydney' },
  { id: 'Asia/Tokyo', label: 'JST · Tokyo' },
];

export const SHORT: Record<string, string> = {
  'Asia/Kolkata': 'IST',
  UTC: 'UTC',
  'Asia/Dubai': 'GST',
  'Asia/Singapore': 'SGT',
  'Europe/London': 'UK',
  'Europe/Berlin': 'CET',
  'America/New_York': 'ET',
  'America/Los_Angeles': 'PT',
  'Australia/Sydney': 'AET',
  'Asia/Tokyo': 'JST',
};

function parts(ts: number, tz: string) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const p = Object.fromEntries(f.formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second };
}

/** offset (ms) of `tz` from UTC at instant `ts` */
export function tzOffset(ts: number, tz: string): number {
  const p = parts(ts, tz);
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(ts / 1000) * 1000;
}

/** "2026-10-09" + "21:00" in zone → epoch ms */
export function zonedToEpoch(date: string, time: string, tz: string): number {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let ts = guess - tzOffset(guess, tz);
  ts = guess - tzOffset(ts, tz); // second pass handles DST edges
  return ts;
}

/** epoch → { date: 'YYYY-MM-DD', time: 'HH:MM' } in zone */
export function epochToZoned(ts: number, tz: string): { date: string; time: string } {
  const p = parts(ts, tz);
  const z = (n: number) => String(n).padStart(2, '0');
  return { date: `${p.y}-${z(p.mo)}-${z(p.d)}`, time: `${z(p.h)}:${z(p.mi)}` };
}

/** true if `tz` is a valid IANA zone in this runtime */
export function isValidZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** "Today, 9:00 PM IST" / "Sat 11 Oct, 9:00 AM IST" */
export function fmtWhen(ts: number, tz = 'Asia/Kolkata', now = Date.now()): string {
  const day = (t: number) => epochToZoned(t, tz).date;
  const time = new Intl.DateTimeFormat('en-IN', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true })
    .format(ts)
    .replace(/\s?(am|pm)/i, (m) => ` ${m.trim().toUpperCase()}`);
  const label =
    day(ts) === day(now)
      ? 'Today'
      : day(ts) === day(now + 86400000)
        ? 'Tomorrow'
        : day(ts) === day(now - 86400000)
          ? 'Yesterday'
          : new Intl.DateTimeFormat('en-IN', {
              timeZone: tz,
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              ...(day(ts).slice(0, 4) !== day(now).slice(0, 4) ? { year: 'numeric' as const } : {}),
            }).format(ts);
  return `${label}, ${time} ${SHORT[tz] ?? tz}`;
}

/** next occurrence after `ts` for a repeat rule, keeping the wall-clock time in `tz` */
export function nextOccurrence(ts: number, repeat: string, tz: string): number | null {
  if (repeat === 'once' || !repeat) return null;
  const { date, time } = epochToZoned(ts, tz);
  const [y, m, d] = date.split('-').map(Number);
  let ny: number;
  let nm = m;
  let nd: number;
  if (repeat === 'daily' || repeat === 'weekly') {
    const dt = new Date(Date.UTC(y, m - 1, d + (repeat === 'daily' ? 1 : 7)));
    ny = dt.getUTCFullYear();
    nm = dt.getUTCMonth() + 1;
    nd = dt.getUTCDate();
  } else if (repeat === 'monthly') {
    nm = m === 12 ? 1 : m + 1;
    ny = m === 12 ? y + 1 : y;
    nd = Math.min(d, new Date(Date.UTC(ny, nm, 0)).getUTCDate()); // 31 Jan → 28/29 Feb
  } else if (repeat === 'yearly') {
    ny = y + 1;
    nd = Math.min(d, new Date(Date.UTC(ny, m, 0)).getUTCDate()); // 29 Feb → 28 Feb
  } else return null;
  const z = (n: number) => String(n).padStart(2, '0');
  return zonedToEpoch(`${ny}-${z(nm)}-${z(nd)}`, time, tz);
}
