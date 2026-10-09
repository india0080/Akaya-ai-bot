/**
 * Natural-language query parser for English, Hindi (Devanagari) and Hinglish.
 *   "school bag under 1500"            → q "school bag", maxPrice 1500
 *   "1500 se kam ka basta, fast delivery" → q "school bag", maxPrice 1500, maxDeliveryDays 2
 *   "अच्छे earbuds 2 हज़ार तक"           → q "earbuds", maxPrice 2000, hint quality
 */
import type { Filters, ParsedQuery, StoreId } from '../types.js';

const DEVANAGARI_DIGITS = '०१२३४५६७८९';
const toAsciiDigits = (s: string) => s.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));

/** Hinglish / Hindi product words → catalogue terms */
const SYNONYMS: [RegExp, string][] = [
  [/\b(basta|bastā)\b|बस्ता/gi, 'school bag'],
  [/\b(joote|jute|joota)\b|जूते|जूता/gi, 'shoes'],
  [/\bghadi\b|घड़ी/gi, 'watch'],
  [/\b(botal|bottle)\b|बोतल/gi, 'bottle'],
  [/\b(kurti|kurta)\b|कुर्ता|कुर्ती/gi, 'kurta'],
  [/फोन|मोबाइल/g, 'phone'],
  [/मिक्सर/g, 'mixer grinder'],
  [/बैग/g, 'bag'],
  [/ईयरबड्स|इयरबड्स/g, 'earbuds'],
  [/पावर ?बैंक/g, 'power bank'],
  [/\b(mixie|mixi)\b/gi, 'mixer grinder'],
  [/\bearphone(s)?\b/gi, 'earbuds'],
];

/** Hinglish / Hindi number words before a multiplier: "do hazaar" → "2 hazaar", "dedh lakh" → "1.5 lakh" */
const NUM_WORDS: Record<string, number> = {
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, chhah: 6, saat: 7, aath: 8, nau: 9, das: 10,
  dedh: 1.5, dhai: 2.5, aadha: 0.5,
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10, 'डेढ़': 1.5, 'ढाई': 2.5,
};
const NUM_WORD_RE = new RegExp(`(^|\\s)(${Object.keys(NUM_WORDS).join('|')})\\s+(?=(hazaa?r|thousand|sau|hundred|lakh|हज़ार|हजार|सौ|लाख))`, 'gi');

const STORE_WORDS: [RegExp, StoreId][] = [
  [/\bamazon\b/i, 'amazon'],
  [/\bflipkart\b/i, 'flipkart'],
  [/\bmyntra\b/i, 'myntra'],
  [/\bmeesho\b/i, 'meesho'],
  [/\bcroma\b/i, 'croma'],
  [/\bajio\b/i, 'ajio'],
  [/\breliance( digital)?\b/i, 'reliance'],
  [/\btata ?cliq\b/i, 'tatacliq'],
];

const FILLER =
  /\b(please|pls|show me|find me|find|search|buy|want|need|i|me|a|an|the|for|my|some|good|best|chahiye|chaahiye|mujhe|ke liye|ka|ki|ke|ek|wala|wali|wale|dikhao|dhundo|kharidna|hai|on|pe|par|from|se|in|with|and|aur|or|ya|ko)\b|चाहिए|मुझे|के लिए|दिखाओ|का|की|के|अच्छा|अच्छे|सस्ता/gi;

function num(raw: string, mult?: string): number {
  let n = parseFloat(raw.replace(/,/g, ''));
  const m = (mult ?? '').toLowerCase();
  if (m === 'k' || m.startsWith('hazar') || m.startsWith('hazaar') || m.startsWith('thousand') || m.startsWith('हज़ार') || m.startsWith('हजार')) n *= 1000;
  else if (m.startsWith('sau') || m.startsWith('सौ') || m.startsWith('hundred')) n *= 100;
  else if (m.startsWith('lakh') || m.startsWith('लाख')) n *= 100000;
  return Math.round(n);
}

const NUM = String.raw`(?:₹|rs\.?|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|hazaa?r|thousand|हज़ार|हजार|sau|सौ|hundred|lakh|लाख)?\s*(?:₹|rs\.?|rupees?|रुपये|रुपए)?`;

export function parseQuery(raw: string): ParsedQuery {
  let s = (' ' + toAsciiDigits(raw.trim()) + ' ').replace(NUM_WORD_RE, (_m, pre: string, w: string) => `${pre}${NUM_WORDS[w.toLowerCase()] ?? NUM_WORDS[w]} `);
  const filters: Filters = {};
  const hints: string[] = [];
  const devanagari = /[\u0900-\u097F]/.test(raw);
  const hinglish = /\b(se kam|tak|ke andar|chahiye|sasta|accha|achha|jaldi|wala|ka|ki|ke liye|mujhe)\b/i.test(raw);

  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) => {
    const m = s.match(re);
    if (m) {
      fn(m);
      s = s.replace(m[0], ' ');
    }
  };

  // ranges: "1000-2000", "between 1000 and 2000", "1000 se 2000 tak"
  take(new RegExp(String.raw`(?:between\s+)?${NUM}\s*(?:-|to|and|se)\s*${NUM}(?:\s*(?:tak|के बीच))?`, 'i'), (m) => {
    filters.minPrice = num(m[1], m[2]);
    filters.maxPrice = num(m[3], m[4]);
  });
  // max: "under 1500", "below ₹2k", "upto 999", "< 1500", "1500 se kam", "1500 tak", "1500 ke andar", "1500 से कम"
  take(new RegExp(String.raw`(?:under|below|less than|upto|up to|within|max|<|budget)\s*${NUM}`, 'i'), (m) => (filters.maxPrice = num(m[1], m[2])));
  take(new RegExp(String.raw`${NUM}\s*(?:se kam|se neeche|ke andar|tak|ke niche|से कम|तक|के अंदर|ke budget)`, 'i'), (m) => (filters.maxPrice = num(m[1], m[2])));
  // min: "above 1000", "over 5k", "1000 se upar"
  take(new RegExp(String.raw`(?:above|over|more than|min|>)\s*${NUM}`, 'i'), (m) => (filters.minPrice = num(m[1], m[2])));
  take(new RegExp(String.raw`${NUM}\s*(?:se upar|se zyada|से ऊपर|से ज़्यादा)`, 'i'), (m) => (filters.minPrice = num(m[1], m[2])));
  // rating: "4 star", "4+ rating", "rating 4 se upar"
  take(/(\d(?:\.\d)?)\s*(?:\+\s*)?(?:star|stars|★|rating)(?:\s*(?:and above|\+|se upar|se zyada))?|rating\s*(?:above|over|se upar)?\s*(\d(?:\.\d)?)/i, (m) => (filters.minRating = parseFloat(m[1] ?? m[2])));
  // delivery
  take(/\b(fast delivery|quick delivery|jaldi|urgent|kal tak|by tomorrow|tomorrow|next day)\b|जल्दी|कल तक/i, (m) => {
    filters.maxDeliveryDays = /kal|tomorrow|next day|कल/i.test(m[0]) ? 1 : 2;
    hints.push('fastest');
  });
  // intent hints
  if (/\b(sasta|saste|cheap|cheapest|budget|kam daam|lowest price)\b|सस्ता|सस्ते/i.test(s)) hints.push('cheapest');
  if (/\b(best|accha|achha|acche|top rated|quality|branded|original)\b|अच्छा|अच्छे|बढ़िया/i.test(s)) hints.push('quality');
  if (/\b(no fake|genuine reviews|real reviews|original)\b/i.test(s)) filters.hideHighFakeRisk = true;

  // stores
  const stores: StoreId[] = [];
  for (const [re, id] of STORE_WORDS) if (re.test(s)) {
    stores.push(id);
    s = s.replace(re, ' ');
  }
  if (stores.length) filters.stores = stores;

  for (const [re, rep] of SYNONYMS) s = s.replace(re, ` ${rep} `);
  s = s
    .replace(/\b(sabse|sasta|saste|sasti|cheap|cheapest|budget|fast|quick|lowest price|top rated|quality|branded|accha|achha|acche|kam daam)\b|सबसे|सस्ता|सस्ते|बढ़िया/gi, ' ')
    .replace(FILLER, ' ')
    .replace(/[,.!?₹]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // de-duplicate repeated words ("school bag bag")
  const words: string[] = [];
  for (const w of s.split(' ')) if (w && words[words.length - 1]?.toLowerCase() !== w.toLowerCase()) words.push(w);
  const q = words.join(' ') || raw.trim();

  return { raw, q, filters, hints: [...new Set(hints)], lang: devanagari ? 'hi' : hinglish ? 'hinglish' : 'en' };
}
