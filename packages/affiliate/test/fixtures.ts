import type { Intent, LinkParams } from '../src/index.js';

/** sample params per intent (every platform × intent is built with these in build.test.ts) */
export const SAMPLE: Record<Intent, LinkParams> = {
  home: {},
  search: { q: 'boAt Rockerz 450 & "wireless"' },
  product: { id: 'B0TEST1234', q: 'boAt Rockerz 450' },
  hotel: { city: 'North Goa', checkin: '2026-12-20', checkout: '2026-12-23', adults: 2 },
  flight: { from: 'DEL', to: 'GOI', date: '2026-12-20', adults: 1 },
  experience: { q: 'Dudhsagar falls tour' },
  food: { q: 'chicken biryani' },
  grocery: { q: 'amul milk 1 L' },
  cart: {},
  ride: { dropoff: 'Kempegowda Airport T2', lat: 13.1986, lng: 77.7066 },
  message: { phone: '+91 98200 00001', text: 'Happy birthday Priya! 🎂 & see you soon' },
};

/** a fully configured affiliate env (fake IDs; never real ones in tests) */
export const ENV = {
  AMAZON_TAG_IN: 'akaya-21',
  AMAZON_TAG_US: 'akaya-20',
  FLIPKART_AFFILIATE_ID: 'akayafk',
  BOOKING_AID: '1234567',
  AGODA_CID: '1900000',
  KLOOK_AID: '45678',
  GETYOURGUIDE_PARTNER_ID: 'AKAYA123',
  CUELINKS_CID: '98765',
  CJ_PID: '1010101',
  TRAVELPAYOUTS_MARKER: '555555',
  TRAVELPAYOUTS_P_AVIASALES: '4114',
  TRAVELPAYOUTS_P_SKYSCANNER: '4115',
  TRAVELPAYOUTS_P_TRIPADVISOR: '4116',
};
