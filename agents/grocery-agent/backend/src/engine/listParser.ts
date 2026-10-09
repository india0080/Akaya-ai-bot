/**
 * Grocery list parser: English, Hindi (Devanagari) and Hinglish, typed or from voice.
 *   "2 kg aata, 1 L Amul milk, 6 eggs"        → atta 2000 g · milk 1000 ml (Amul) · eggs 6 pc
 *   "aadha kilo pyaz aur ek darjan ande"        → onion 500 g · eggs 12 pc
 *   "२ किलो आटा, दूध १ लीटर"                    → atta 2000 g · milk 1000 ml
 */
import { BRANDS, ITEMS, type ItemDef } from '../providers/catalog.js';
import type { ParsedItem, Unit } from '../types.js';

const DEV = '०१२३४५६७८९';
const ascii = (s: string) => s.replace(/[०-९]/g, (d) => String(DEV.indexOf(d)));

const NUM_WORDS: [RegExp, string][] = [
  [/(^|\s)(aadha|aadhaa|adha|half|आधा|आधी)(?=\s|$)/gi, '$10.5'],
  [/(^|\s)(dedh|derh|डेढ़|डेढ)(?=\s|$)/gi, '$11.5'],
  [/(^|\s)(dhai|dhaai|ढाई)(?=\s|$)/gi, '$12.5'],
  [/(^|\s)(ek|one|एक)(?=\s|$)/gi, '$11'],
  [/(^|\s)(do|two|दो)(?=\s|$)/gi, '$12'],
  [/(^|\s)(teen|three|तीन)(?=\s|$)/gi, '$13'],
  [/(^|\s)(char|chaar|four|चार)(?=\s|$)/gi, '$14'],
  [/(^|\s)(paanch|panch|five|पांच|पाँच)(?=\s|$)/gi, '$15'],
  [/(^|\s)(chhe|chah|six|छह|छः)(?=\s|$)/gi, '$16'],
  [/(^|\s)(saat|seven|सात)(?=\s|$)/gi, '$17'],
  [/(^|\s)(aath|eight|आठ)(?=\s|$)/gi, '$18'],
  [/(^|\s)(das|ten|दस)(?=\s|$)/gi, '$110'],
  [/(^|\s)(barah|baarah|twelve|बारह)(?=\s|$)/gi, '$112'],
];

const UNIT_RE =
  /(\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\s*(kgs?|kilos?|kilograms?|किलो|gms?|grams?|g|ग्राम|litres?|liters?|ltrs?|l|लीटर|ml|मिली|dozens?|darjan|दर्जन|pcs?|pieces?|nos|packets?|packs?|pkts?|पैकेट)?(?![a-z\u0900-\u097F])/i;

type U = 'kg' | 'g' | 'l' | 'ml' | 'dozen' | 'pc' | 'pack' | null;
function unitOf(raw?: string): U {
  if (!raw) return null;
  const u = raw.toLowerCase();
  if (/^(kg|kilo|किलो)/.test(u)) return 'kg';
  if (/^(g|gm|gram|ग्राम)/.test(u)) return 'g';
  if (/^(l|ltr|litre|liter|लीटर)/.test(u)) return 'l';
  if (/^(ml|मिली)/.test(u)) return 'ml';
  if (/^(dozen|darjan|दर्जन)/.test(u)) return 'dozen';
  if (/^(pc|piece|nos)/.test(u)) return 'pc';
  return 'pack';
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const WORDS = ITEMS.flatMap((it) => it.words.map((w) => ({ w, it }))).sort((a, b) => b.w.length - a.w.length);
const hasDev = (s: string) => /[\u0900-\u097F]/.test(s);
const matchWord = (seg: string, w: string) => (hasDev(w) ? seg.includes(w) : new RegExp(`(^|[^a-z])${esc(w)}([^a-z]|$)`, 'i').test(seg));

export function findItem(seg: string): ItemDef | undefined {
  return WORDS.find(({ w }) => matchWord(seg, w))?.it;
}

export function formatQty(qty: number, unit: Unit, dozenItem = false): string {
  const r = (n: number) => String(Math.round(n * 100) / 100);
  if (unit === 'g') return qty >= 1000 ? `${r(qty / 1000)} kg` : `${r(qty)} g`;
  if (unit === 'ml') return qty >= 1000 ? `${r(qty / 1000)} L` : `${r(qty)} ml`;
  if (qty === 12 && dozenItem) return '1 dozen';
  return `${r(qty)} pc${qty === 1 ? '' : 's'}`;
}

/** variant words → pack-name keyword the optimizer should prefer */
const VARIANTS: [RegExp, string][] = [
  [/mustard|sarson|सरसों/i, 'Mustard'],
  [/sunflower/i, 'Sunflower'],
  [/brown bread|whole wheat bread|atta bread/i, 'Whole Wheat|Brown'],
  [/white bread/i, 'White'],
  [/brown eggs?/i, 'Brown'],
  [/basmati/i, 'Basmati'],
  [/sona masoori/i, 'Sona Masoori'],
  [/full cream/i, 'Full Cream'],
  [/toned/i, 'Toned'],
  [/filter coffee/i, 'Filter'],
  [/instant coffee/i, 'Instant'],
];
const DOZEN_ITEMS = new Set(['eggs', 'banana']);

export interface ParseResult {
  items: ParsedItem[];
  unknown: string[];
  lang: 'en' | 'hi' | 'hinglish';
}

export function parseList(text: string): ParseResult {
  let seq = 0;
  const src = ascii(text);
  const segments = src
    .split(/\n|,|;|\+|\s&\s|(?:^|\s)(?:and|aur|or|और|तथा)(?=\s)/i)
    .map((s) => s.replace(/^[\s\-•*·\d.)]*?(?=\d|[^\d\s.)\-•*·])/, '').trim())
    .filter(Boolean);
  const items: ParsedItem[] = [];
  const unknown: string[] = [];
  for (const raw of segments) {
    let seg = ' ' + raw + ' ';
    for (const [re, rep] of NUM_WORDS) seg = seg.replace(re, rep);
    seg = seg.trim();
    const it = findItem(seg);
    if (!it) {
      if (/[a-z\u0900-\u097F]{2,}/i.test(raw)) unknown.push(raw);
      continue;
    }
    const brand = BRANDS.find((b) => new RegExp(`(^|[^a-z])${esc(b)}([^a-z]|$)`, 'i').test(seg) && it.packs.some((p) => p.brand === b));
    const m = seg.match(UNIT_RE);
    let n = m ? (m[1].includes('/') ? Number(m[1].split('/')[0]) / Number(m[1].split('/')[1]) : parseFloat(m[1])) : NaN;
    let u = unitOf(m?.[2]);
    if (!m && /\b(dozen|darjan)\b|दर्जन/i.test(seg)) {
      n = 1;
      u = 'dozen';
    }
    const smallest = Math.min(...it.packs.filter((p) => !brand || p.brand === brand).map((p) => p.size));
    let qty: number;
    let confidence = 1;
    if (Number.isNaN(n)) {
      qty = it.defaultQty;
      confidence = 0.75;
    } else if (u === 'kg' || u === 'l') qty = it.unit === 'pc' ? n * it.defaultQty : n * 1000;
    else if (u === 'g' || u === 'ml') qty = it.unit === 'pc' ? it.defaultQty : n;
    else if (u === 'dozen') qty = it.unit === 'pc' ? n * 12 : n * smallest;
    else if (u === 'pc') qty = it.unit === 'pc' ? n : n * smallest;
    else qty = it.unit === 'pc' ? (u === 'pack' ? n * smallest : n) : n * smallest; // "2 Amul butter" / "2 packet milk"
    if ((u === 'kg' || u === 'l') && it.unit === 'pc') confidence = 0.6;
    qty = Math.max(1, Math.round(qty));
    const existing = items.find((x) => x.key === it.key && x.brand === brand);
    if (existing) {
      existing.qty += qty;
      existing.display = formatQty(existing.qty, existing.unit, DOZEN_ITEMS.has(existing.key));
      existing.raw += `, ${raw}`;
      continue;
    }
    const variant = VARIANTS.find(([re]) => re.test(seg) && it.packs.some((p) => new RegExp(VARIANTS.find((v) => v[0] === re)![1], 'i').test(p.name)))?.[1];
    items.push({ id: `i${++seq}`, raw, key: it.key, name: it.name, emoji: it.emoji, qty, unit: it.unit, display: formatQty(qty, it.unit, DOZEN_ITEMS.has(it.key)), brand, variant, confidence });
  }
  const dev = hasDev(text);
  const hinglish = /\b(aata|doodh|anda|ande|chawal|pyaz|aloo|cheeni|namak|dahi|makhan|tel|kilo|darjan|aadha|dedh|aur|chahiye|wala|ka|ke)\b/i.test(text);
  return { items, unknown, lang: dev ? 'hi' : hinglish ? 'hinglish' : 'en' };
}
