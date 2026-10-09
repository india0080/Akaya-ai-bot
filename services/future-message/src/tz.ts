/** Time-zone math with Intl only (no deps). Shared logic with the app (app/src/future/tz.ts). */
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

export function tzOffset(ts: number, tz: string): number {
  const p = parts(ts, tz);
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(ts / 1000) * 1000;
}

export function zonedToEpoch(date: string, time: string, tz: string): number {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const ts = guess - tzOffset(guess, tz);
  return guess - tzOffset(ts, tz);
}

export function epochToZoned(ts: number, tz: string): { date: string; time: string } {
  const p = parts(ts, tz);
  const z = (n: number) => String(n).padStart(2, '0');
  return { date: `${p.y}-${z(p.mo)}-${z(p.d)}`, time: `${z(p.h)}:${z(p.mi)}` };
}

export function isValidZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** next occurrence keeping wall-clock time in `tz`; monthly on the 31st clamps to the month's last day */
export function nextOccurrence(ts: number, repeat: string, tz: string): number | null {
  if (!repeat || repeat === 'once') return null;
  const { date, time } = epochToZoned(ts, tz);
  const [y, m, d] = date.split('-').map(Number);
  let ny = y;
  let nm = m;
  let nd = d;
  if (repeat === 'daily' || repeat === 'weekly') {
    const dt = new Date(Date.UTC(y, m - 1, d + (repeat === 'daily' ? 1 : 7)));
    ny = dt.getUTCFullYear();
    nm = dt.getUTCMonth() + 1;
    nd = dt.getUTCDate();
  } else if (repeat === 'monthly') {
    nm = m === 12 ? 1 : m + 1;
    ny = m === 12 ? y + 1 : y;
    nd = Math.min(d, new Date(Date.UTC(ny, nm, 0)).getUTCDate());
  } else if (repeat === 'yearly') {
    ny = y + 1;
    nd = Math.min(d, new Date(Date.UTC(ny, m, 0)).getUTCDate()); // 29 Feb → 28 Feb
  } else return null;
  const z = (n: number) => String(n).padStart(2, '0');
  return zonedToEpoch(`${ny}-${z(nm)}-${z(nd)}`, time, tz);
}
