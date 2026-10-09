/** Calendar-date helpers on 'YYYY-MM-DD' strings (zone-free; combine with @akaya/tz for instants). */
const z = (n: number) => String(n).padStart(2, '0');

export const ymd = (y: number, m: number, d: number): string => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${dt.getUTCFullYear()}-${z(dt.getUTCMonth() + 1)}-${z(dt.getUTCDate())}`;
};

export const splitDate = (date: string): [number, number, number] =>
  date.split('-').map(Number) as [number, number, number];

export const addDays = (date: string, n: number): string => {
  const [y, m, d] = splitDate(date);
  return ymd(y, m, d + n);
};

/** 0 = Sunday */
export const weekday = (date: string): number => {
  const [y, m, d] = splitDate(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export const daysInMonth = (y: number, m: number): number => new Date(Date.UTC(y, m, 0)).getUTCDate();

export const hhmm = (h: number, m: number): string => `${z(h)}:${z(m)}`;
