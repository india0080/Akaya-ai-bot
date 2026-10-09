/** Minimal RFC 4180 CSV reader (quotes, escaped quotes, CRLF, BOM) plus header-alias helpers for report exports. */

export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const s = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

const norm = (h: string) =>
  h
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export type Record_ = Record<string, string>;

/**
 * Find the header row (the first row containing every `required` alias group), then map data rows to
 * { normalisedHeader: value }. Report exports often start with a title line, so the header is searched for.
 */
export function readTable(text: string, required: string[][]): Record_[] {
  const rows = parseCsv(text, text.split('\n', 1)[0].includes('\t') ? '\t' : ',');
  const h = rows.findIndex((r) => {
    const names = r.map(norm);
    return required.every((group) => group.some((a) => names.includes(a)));
  });
  if (h < 0) throw new ImportError(`header not found (expected columns: ${required.map((g) => g[0]).join(', ')})`);
  const head = rows[h].map(norm);
  return rows.slice(h + 1).map((r) => Object.fromEntries(head.map((k, i) => [k, (r[i] ?? '').trim()])));
}

/** first non-empty value among header aliases */
export const pick = (rec: Record_, aliases: string[]) =>
  aliases.map((a) => rec[a]).find((v) => v !== undefined && v !== '') ?? '';

/** "₹1,234.50", "$12.00", "(12.00)" or "-12" → number (decimal point only; exports use it) */
export function num(v: string): number {
  if (!v) return 0;
  const neg = /^\(.*\)$/.test(v.trim()) || v.trim().startsWith('-');
  const n = Number(v.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? (neg ? -n : n) : 0;
}

/** dates like 2026-10-01, 01/10/2026 (DD/MM), 2026-10-01 14:03:00, Oct 1, 2026 → YYYY-MM-DD */
export function ymd(v: string): string {
  const s = v.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  throw new ImportError(`unreadable date "${v}"`);
}

export class ImportError extends Error {}
