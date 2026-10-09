import { describe, expect, it } from 'vitest';
import {
  AMAZON_ASSOCIATE_STATEMENT,
  affiliateEnvFrom,
  allEnvVars,
  buildLink,
  detectIntent,
  disclosureText,
  envVarsFor,
  findPlatform,
  hasProgramme,
  messageLink,
  needsDisclosure,
  PLATFORMS,
  summarize,
  type EarningRow,
} from '../src/index.js';

describe('disclosure', () => {
  it('short and long, English and Hindi', () => {
    expect(disclosureText()).toBe('Akaya may earn a commission');
    expect(disclosureText({ lang: 'hi' })).toContain('कमीशन');
    expect(disclosureText({ style: 'long', platforms: ['booking'] })).not.toContain('Amazon');
    expect(disclosureText({ style: 'long', platforms: ['amazon'] })).toContain(AMAZON_ASSOCIATE_STATEMENT);
  });
  it('needsDisclosure only for active affiliate links', () => {
    const plain = buildLink({ platform: 'swiggy', intent: 'home' });
    const tagged = buildLink({ platform: 'booking', intent: 'home', env: { BOOKING_AID: '1' } });
    expect(needsDisclosure([plain])).toBe(false);
    expect(needsDisclosure([plain, tagged])).toBe(true);
  });
});

describe('config', () => {
  it('lists env vars from the registry (no hard-coded IDs)', () => {
    const vars = allEnvVars();
    for (const v of [
      'AMAZON_TAG_IN',
      'AMAZON_TAG_US',
      'FLIPKART_AFFILIATE_ID',
      'BOOKING_AID',
      'AGODA_CID',
      'CUELINKS_CID',
      'CJ_PID',
      'TRAVELPAYOUTS_MARKER',
      'ADMITAD_CODE_MYNTRA',
      'IMPACT_BASE_SKYSCANNER',
    ])
      expect(vars).toContain(v);
    expect(envVarsFor(PLATFORMS.swiggy)).toEqual([]);
  });
  it('affiliateEnvFrom strips a prefix and keeps only known keys', () => {
    expect(
      affiliateEnvFrom(
        { VITE_AFF_BOOKING_AID: ' 42 ', VITE_AFF_SECRET: 'x', BOOKING_AID: 'no', VITE_OTHER: 'y' },
        'VITE_AFF_',
      ),
    ).toEqual({ BOOKING_AID: '42' });
  });
  it('the registry source contains no affiliate ID literals', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/platforms.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/tag=|affid=|aid=\d|cid=\d|partner_id=/);
  });
});

describe('chat intent detection', () => {
  const cases: [string, unknown][] = [
    ['Swiggy se biryani', { platform: 'swiggy', intent: 'food', params: { q: 'biryani' } }],
    ['order paneer tikka on Zomato', { platform: 'zomato', intent: 'food', params: { q: 'paneer tikka' } }],
    ['Blinkit se doodh aur bread mangao', { platform: 'blinkit', intent: 'grocery', params: { q: 'doodh aur bread' } }],
    ['swiggy instamart pe atta', { platform: 'instamart', intent: 'grocery', params: { q: 'atta' } }],
    ['Uber to airport', { platform: 'uber', intent: 'ride', params: { dropoff: 'airport' } }],
    ['Ola se MG Road jana hai', { platform: 'ola', intent: 'ride', params: { dropoff: 'mg road' } }],
    ['Amazon pe boat headphones', { platform: 'amazon', intent: 'search', params: { q: 'boat headphones' } }],
    ['hotels in Goa on Booking.com', { platform: 'booking', intent: 'hotel', params: { city: 'goa' } }],
    [
      'MMT flight DEL to BOM 2026-10-20',
      { platform: 'makemytrip', intent: 'flight', params: { from: 'DEL', to: 'BOM', date: '2026-10-20' } },
    ],
    ['Klook things to do in Bali', { platform: 'klook', intent: 'experience', params: { q: 'bali' } }],
    ['open Zepto', { platform: 'zepto', intent: 'home', params: {} }],
  ];
  it.each(cases)('%s', (text, want) => expect(detectIntent(text)).toEqual(want));
  it('returns null without a platform', () => {
    expect(detectIntent('what is the weather today')).toBeNull();
    expect(detectIntent('send a text message to Rahul')).toBeNull();
  });
  it('detected intents always build', () => {
    for (const [text] of cases) {
      const d = detectIntent(text)!;
      expect(() => buildLink({ ...d, campaign: 'chat' })).not.toThrow();
    }
  });
});

describe('hasProgramme', () => {
  it('true for affiliate platforms, false for deep-link-only ones', () => {
    for (const id of ['amazon', 'flipkart', 'booking', 'myntra', 'makemytrip', 'klook'])
      expect(hasProgramme(id)).toBe(true);
    for (const id of ['swiggy', 'zomato', 'blinkit', 'zepto', 'uber', 'ola', 'whatsapp', 'nope'])
      expect(hasProgramme(id)).toBe(false);
  });
});

describe('messageLink', () => {
  it('WhatsApp universal link, Signal scheme, SMS body; no tracking', () => {
    expect(messageLink('whatsapp', '+91 98200 00001', 'Hi Priya & co')).toBe(
      'https://wa.me/919820000001?text=Hi%20Priya%20%26%20co',
    );
    expect(messageLink('whatsapp', 'Rahul', 'Hi')).toBe('https://wa.me/?text=Hi');
    expect(messageLink('signal', 'Neha', 'Hi')).toBe('sgnl://send?text=Hi');
    expect(messageLink('sms', '+91 98200 00002', 'Hi')).toBe('sms:+919820000002?body=Hi');
    for (const p of ['whatsapp', 'signal', 'sms'] as const) expect(messageLink(p, '1', 'x')).not.toMatch(/utm_/);
  });
});

describe('findPlatform', () => {
  it.each([
    ['Booking.com', 'booking'],
    ['MakeMyTrip IN CPS', 'makemytrip'],
    ['Myntra', 'myntra'],
    ['AJIO.com', 'ajio'],
    ['Tata CLiQ', 'tatacliq'],
    ['https://www.agoda.com/en-in/hotel', 'agoda'],
    ['https://m.flipkart.com/x', 'flipkart'],
  ])('%s → %s', (name, id) => expect(findPlatform(name)?.id).toBe(id));
  it('undefined for unknown names', () => {
    expect(findPlatform('Some Shop')).toBeUndefined();
    expect(findPlatform('')).toBeUndefined();
  });
});

describe('summarize', () => {
  const row = (p: Partial<EarningRow>): EarningRow => ({
    source: 'test',
    externalId: String(Math.random()),
    platform: 'amazon',
    date: '2026-10-01',
    orders: 1,
    sales: 1000,
    commission: 40,
    currency: 'INR',
    status: 'approved',
    ...p,
  });
  it('per-platform totals, conversion, pending, currencies and rejected rows', () => {
    const s = summarize({ amazon: 100, booking: 20, swiggy: 7 }, [
      row({}),
      row({ orders: 2, sales: 2500.555, commission: 100.333, status: 'pending' }),
      row({ platform: 'booking', sales: 12000, commission: 480 }),
      row({ platform: 'booking', commission: 999, status: 'rejected' }),
      row({ platform: 'agoda', commission: 10, currency: 'USD' }),
    ]);
    expect(s.currency).toBe('INR');
    expect(s.platforms.map((p) => p.platform)).toEqual(['booking', 'amazon', 'swiggy']);
    const amazon = s.platforms.find((p) => p.platform === 'amazon')!;
    expect(amazon).toMatchObject({
      name: 'Amazon',
      clicks: 100,
      orders: 3,
      sales: 3500.56,
      commission: 140.33,
      conversion: 0.03,
    });
    expect(s.totals).toEqual({ clicks: 127, orders: 4, sales: 15500.56, commission: 620.33, pending: 100.33 });
    expect(s.otherCurrencyRows).toBe(1);
    expect(s.platforms.find((p) => p.platform === 'swiggy')!.conversion).toBe(0);
  });
});
