/**
 * THE platform registry: one data file for every store, travel site, food/grocery/ride app and messenger
 * Akaya links to. Builders return the public web URL for an intent; affiliate tagging, UTM and network
 * wrapping happen in build.ts. URL patterns are the platforms' public search/deep-link URLs; verify any
 * change on the live site and in the partner dashboard (docs/AFFILIATE.md).
 *
 * Adding a platform = adding one entry here (+ its env var in .env.example). Tests cover every entry.
 */
import { adults, coord, enc, iata, id, ownUrl, qs, slug, text, ymd } from './safe.js';
import type { LinkParams, PlatformDef } from './types.js';

// ---------- small date formatters (input already validated by ymd) ----------
const dmy = (v?: string) => {
  const d = ymd(v);
  return d ? `${d[2]}/${d[1]}/${d[0]}` : null; // 15/10/2026
};
const mdyCompact = (v?: string) => {
  const d = ymd(v);
  return d ? `${d[1]}${d[2]}${d[0]}` : null; // 10152026
};
const iso = (v?: string) => (ymd(v) ? v! : null);

const AMAZON_MARKETS: Record<string, string> = {
  in: 'amazon.in',
  us: 'amazon.com',
  uk: 'amazon.co.uk',
  de: 'amazon.de',
  ca: 'amazon.ca',
  ae: 'amazon.ae',
  jp: 'amazon.co.jp',
};
const market = (p: LinkParams) => (p.market && AMAZON_MARKETS[p.market] ? p.market : 'in');
const amazonHost = (p: LinkParams) => `www.${AMAZON_MARKETS[market(p)]}`;

/** search builder for sites with a simple "?<key>=<query>" search page */
const searchAt = (base: string, key: string) => (p: LinkParams) => {
  const q = text(p.q);
  return q ? `${base}?${key}=${enc(q)}` : null;
};
/** product: a feed URL on the platform's own hosts, else fall back to search */
const productOr = (hosts: string[], search: (p: LinkParams) => string | null) => (p: LinkParams) =>
  ownUrl(p.url, hosts) ?? search(p);

const amazonSearch = (p: LinkParams) => {
  const q = text(p.q);
  return q ? `https://${amazonHost(p)}/s?k=${enc(q)}` : null;
};
const myntraSearch = (p: LinkParams) => {
  const s = slug(p.q);
  return s ? `https://www.myntra.com/${s}` : null;
};
const tatacliqSearch = (p: LinkParams) => {
  const q = text(p.q);
  return q ? `https://www.tatacliq.com/search/?searchCategory=all&text=${enc(q)}` : null;
};

const NETWORK_RETAIL = ['cuelinks', 'admitad', 'earnkaro'] as const;
const NETWORK_TRAVEL_IN = ['cuelinks', 'admitad'] as const;
const NO_PROGRAM = 'No public affiliate programme. Deep link only; partnership TODO.';

const def = (p: PlatformDef) => p;

export const PLATFORMS = {
  // ---------------------------------------------------------------- shopping
  amazon: def({
    id: 'amazon',
    name: 'Amazon',
    category: 'shopping',
    regions: ['in', 'global'],
    color: '#ff9900',
    mono: 'a',
    ink: '#1b1530',
    hosts: Object.values(AMAZON_MARKETS),
    android: 'in.amazon.mShop.android.shopping',
    aliases: ['amazon', 'amazon.in', 'amzn'],
    intents: {
      home: (p) => `https://${amazonHost(p)}/`,
      search: amazonSearch,
      product: (p) => {
        const asin = id(p.id);
        if (asin) return `https://${amazonHost(p)}/dp/${asin}`;
        return ownUrl(p.url, Object.values(AMAZON_MARKETS)) ?? amazonSearch(p);
      },
    },
    affiliate: {
      param: { name: 'tag', env: (p) => `AMAZON_TAG_${market(p).toUpperCase()}` },
      signup: 'https://affiliate-program.amazon.in/ (one Associates account per marketplace)',
      notes: 'Associates must make 3 qualifying sales within 180 days or the account closes.',
    },
  }),
  flipkart: def({
    id: 'flipkart',
    name: 'Flipkart',
    category: 'shopping',
    regions: ['in'],
    color: '#2874f0',
    mono: 'F',
    hosts: ['flipkart.com', 'dl.flipkart.com'],
    android: 'com.flipkart.android',
    aliases: ['flipkart', 'fk'],
    intents: {
      home: () => 'https://www.flipkart.com/',
      search: searchAt('https://www.flipkart.com/search', 'q'),
      product: productOr(['flipkart.com', 'dl.flipkart.com'], searchAt('https://www.flipkart.com/search', 'q')),
    },
    affiliate: {
      param: { name: 'affid', env: 'FLIPKART_AFFILIATE_ID', sub: 'affExtParam1' },
      signup: 'https://affiliate.flipkart.com/',
    },
  }),
  myntra: def({
    id: 'myntra',
    name: 'Myntra',
    category: 'shopping',
    regions: ['in'],
    color: '#ff3f6c',
    mono: 'M',
    hosts: ['myntra.com'],
    android: 'com.myntra.android',
    aliases: ['myntra'],
    intents: {
      home: () => 'https://www.myntra.com/',
      search: myntraSearch,
      product: (p) => {
        const pid = id(p.id);
        return pid ? `https://www.myntra.com/${pid}` : (ownUrl(p.url, ['myntra.com']) ?? myntraSearch(p));
      },
    },
    affiliate: { networks: [...NETWORK_RETAIL], signup: 'Via Cuelinks / Admitad / EarnKaro (no direct programme)' },
  }),
  ajio: def({
    id: 'ajio',
    name: 'AJIO',
    category: 'shopping',
    regions: ['in'],
    color: '#2c4152',
    mono: 'AJ',
    hosts: ['ajio.com'],
    android: 'com.ril.ajio',
    aliases: ['ajio'],
    intents: {
      home: () => 'https://www.ajio.com/',
      search: searchAt('https://www.ajio.com/search/', 'text'),
      product: productOr(['ajio.com'], searchAt('https://www.ajio.com/search/', 'text')),
    },
    affiliate: { networks: [...NETWORK_RETAIL], signup: 'Via Cuelinks / Admitad / EarnKaro' },
  }),
  nykaa: def({
    id: 'nykaa',
    name: 'Nykaa',
    category: 'shopping',
    regions: ['in'],
    color: '#fc2779',
    mono: 'N',
    hosts: ['nykaa.com'],
    android: 'com.fsn.nykaa',
    aliases: ['nykaa'],
    intents: {
      home: () => 'https://www.nykaa.com/',
      search: searchAt('https://www.nykaa.com/search/result/', 'q'),
      product: productOr(['nykaa.com'], searchAt('https://www.nykaa.com/search/result/', 'q')),
    },
    affiliate: { networks: [...NETWORK_RETAIL], signup: 'Via Cuelinks / Admitad / EarnKaro' },
  }),
  croma: def({
    id: 'croma',
    name: 'Croma',
    category: 'shopping',
    regions: ['in'],
    color: '#0bb3a3',
    mono: 'C',
    hosts: ['croma.com'],
    android: 'com.croma.app',
    aliases: ['croma'],
    intents: {
      home: () => 'https://www.croma.com/',
      search: searchAt('https://www.croma.com/searchB', 'q'),
      product: productOr(['croma.com'], searchAt('https://www.croma.com/searchB', 'q')),
    },
    affiliate: { networks: [...NETWORK_RETAIL], signup: 'Via Cuelinks / Admitad / EarnKaro' },
  }),
  tatacliq: def({
    id: 'tatacliq',
    name: 'Tata CLiQ',
    category: 'shopping',
    regions: ['in'],
    color: '#da1c5c',
    mono: 'TC',
    hosts: ['tatacliq.com'],
    android: 'com.tul.tatacliq',
    aliases: ['tata cliq', 'tatacliq', 'cliq'],
    intents: {
      home: () => 'https://www.tatacliq.com/',
      search: tatacliqSearch,
      product: (p) => ownUrl(p.url, ['tatacliq.com']) ?? tatacliqSearch(p),
    },
    affiliate: { networks: [...NETWORK_RETAIL], signup: 'Via Cuelinks / Admitad / EarnKaro' },
  }),
  meesho: def({
    id: 'meesho',
    name: 'Meesho',
    category: 'shopping',
    regions: ['in'],
    color: '#9f2089',
    mono: 'Me',
    hosts: ['meesho.com'],
    android: 'com.meesho.supply',
    aliases: ['meesho'],
    intents: {
      home: () => 'https://www.meesho.com/',
      search: searchAt('https://www.meesho.com/search', 'q'),
      product: productOr(['meesho.com'], searchAt('https://www.meesho.com/search', 'q')),
    },
    affiliate: { networks: [...NETWORK_RETAIL], signup: 'Via Cuelinks / EarnKaro' },
  }),
  'reliance-digital': def({
    id: 'reliance-digital',
    name: 'Reliance Digital',
    category: 'shopping',
    regions: ['in'],
    color: '#e42529',
    mono: 'RD',
    hosts: ['reliancedigital.in'],
    aliases: ['reliance digital', 'reliance'],
    intents: {
      home: () => 'https://www.reliancedigital.in/',
      search: searchAt('https://www.reliancedigital.in/search', 'q'),
      product: productOr(['reliancedigital.in'], searchAt('https://www.reliancedigital.in/search', 'q')),
    },
    affiliate: { networks: [...NETWORK_RETAIL], signup: 'Via Cuelinks / Admitad' },
  }),

  // ---------------------------------------------------------------- travel
  booking: def({
    id: 'booking',
    name: 'Booking.com',
    category: 'travel',
    regions: ['in', 'global'],
    color: '#003580',
    mono: 'B.',
    hosts: ['booking.com'],
    android: 'com.booking',
    aliases: ['booking.com', 'booking'],
    intents: {
      home: () => 'https://www.booking.com/',
      hotel: (p) => {
        const city = text(p.city ?? p.q);
        if (!city) return null;
        return `https://www.booking.com/searchresults.html?${qs({ ss: city, checkin: iso(p.checkin), checkout: iso(p.checkout), group_adults: adults(p), no_rooms: 1 })}`;
      },
    },
    affiliate: {
      param: { name: 'aid', env: 'BOOKING_AID', sub: 'label' },
      signup: 'https://www.booking.com/affiliate-program/ (Booking.com Affiliate Partner Programme)',
    },
  }),
  agoda: def({
    id: 'agoda',
    name: 'Agoda',
    category: 'travel',
    regions: ['in', 'global'],
    color: '#5c2d91',
    mono: 'ag',
    hosts: ['agoda.com'],
    android: 'com.agoda.mobile.consumer',
    aliases: ['agoda'],
    intents: {
      home: () => 'https://www.agoda.com/',
      hotel: (p) => {
        const city = text(p.city ?? p.q);
        if (!city) return null;
        return `https://www.agoda.com/search?${qs({ textToSearch: city, checkIn: iso(p.checkin), checkOut: iso(p.checkout), adults: adults(p), rooms: 1 })}`;
      },
    },
    affiliate: { param: { name: 'cid', env: 'AGODA_CID', sub: 'tag' }, signup: 'https://partners.agoda.com/' },
  }),
  expedia: def({
    id: 'expedia',
    name: 'Expedia',
    category: 'travel',
    regions: ['global'],
    color: '#fddb32',
    mono: 'Ex',
    hosts: ['expedia.com', 'expedia.co.in', 'expedia.co.uk'],
    android: 'com.expedia.bookings',
    aliases: ['expedia'],
    intents: {
      home: () => 'https://www.expedia.com/',
      hotel: (p) => {
        const city = text(p.city ?? p.q);
        if (!city) return null;
        return `https://www.expedia.com/Hotel-Search?${qs({ destination: city, startDate: iso(p.checkin), endDate: iso(p.checkout), adults: adults(p) })}`;
      },
      flight: (p) => {
        const from = iata(p.from);
        const to = iata(p.to);
        const d = ymd(p.date);
        if (!from || !to || !d) return null;
        const leg = `from:${from},to:${to},departure:${+d[1]}/${+d[2]}/${d[0]}TANYT`;
        return `https://www.expedia.com/Flights-Search?${qs({ trip: 'oneway', leg1: leg, passengers: `adults:${adults(p)}`, mode: 'search' })}`;
      },
    },
    affiliate: { networks: ['cj', 'impact'], signup: 'Expedia Group Affiliate Program (via CJ / Impact)' },
  }),
  'hotels-com': def({
    id: 'hotels-com',
    name: 'Hotels.com',
    category: 'travel',
    regions: ['global'],
    color: '#d32f2f',
    mono: 'H',
    hosts: ['hotels.com'],
    android: 'com.hcom.android',
    aliases: ['hotels.com', 'hotels com'],
    intents: {
      home: () => 'https://www.hotels.com/',
      hotel: (p) => {
        const city = text(p.city ?? p.q);
        if (!city) return null;
        return `https://www.hotels.com/Hotel-Search?${qs({ destination: city, startDate: iso(p.checkin), endDate: iso(p.checkout), adults: adults(p) })}`;
      },
    },
    affiliate: { networks: ['cj', 'impact'], signup: 'Expedia Group Affiliate Program (via CJ / Impact)' },
  }),
  tripadvisor: def({
    id: 'tripadvisor',
    name: 'Tripadvisor',
    category: 'travel',
    regions: ['in', 'global'],
    color: '#34e0a1',
    mono: 'TA',
    hosts: ['tripadvisor.in', 'tripadvisor.com'],
    android: 'com.tripadvisor.tripadvisor',
    aliases: ['tripadvisor', 'trip advisor'],
    intents: {
      home: () => 'https://www.tripadvisor.in/',
      search: searchAt('https://www.tripadvisor.in/Search', 'q'),
      hotel: (p) => {
        const city = text(p.city ?? p.q);
        return city ? `https://www.tripadvisor.in/Search?${qs({ q: `${city} hotels` })}` : null;
      },
      experience: (p) => {
        const q = text(p.q ?? p.city);
        return q ? `https://www.tripadvisor.in/Search?${qs({ q: `${q} things to do` })}` : null;
      },
    },
    affiliate: { networks: ['cj', 'travelpayouts'], signup: 'Tripadvisor via CJ / Travelpayouts' },
  }),
  makemytrip: def({
    id: 'makemytrip',
    name: 'MakeMyTrip',
    category: 'travel',
    regions: ['in'],
    color: '#e7262b',
    mono: 'my',
    hosts: ['makemytrip.com'],
    android: 'com.makemytrip',
    aliases: ['makemytrip', 'make my trip', 'mmt'],
    intents: {
      home: () => 'https://www.makemytrip.com/',
      hotel: (p) => {
        const city = text(p.city ?? p.q);
        if (!city) return null;
        return `https://www.makemytrip.com/hotels/hotel-listing/?${qs({ checkin: mdyCompact(p.checkin), checkout: mdyCompact(p.checkout), searchText: city, roomStayQualifier: `${adults(p)}e0e` })}`;
      },
      flight: (p) => {
        const from = iata(p.from);
        const to = iata(p.to);
        const d = dmy(p.date);
        if (!from || !to || !d) return null;
        return `https://www.makemytrip.com/flight/search?${qs({ itinerary: `${from}-${to}-${d}`, tripType: 'O', paxType: `A-${adults(p)}_C-0_I-0`, cabinClass: 'E' })}`;
      },
    },
    affiliate: { networks: [...NETWORK_TRAVEL_IN], signup: 'Via Cuelinks / Admitad' },
  }),
  goibibo: def({
    id: 'goibibo',
    name: 'Goibibo',
    category: 'travel',
    regions: ['in'],
    color: '#2276e3',
    mono: 'go',
    hosts: ['goibibo.com'],
    android: 'com.goibibo',
    aliases: ['goibibo', 'go ibibo'],
    intents: {
      home: () => 'https://www.goibibo.com/',
      hotel: (p) => {
        const s = slug(p.city ?? p.q);
        return s ? `https://www.goibibo.com/hotels/hotels-in-${s}-ct/` : null;
      },
      flight: (p) => {
        const from = iata(p.from);
        const to = iata(p.to);
        const d = ymd(p.date);
        if (!from || !to || !d) return null;
        return `https://www.goibibo.com/flights/air-${from}-${to}-${d.join('')}--${adults(p)}-0-0-E-D/`;
      },
    },
    affiliate: { networks: [...NETWORK_TRAVEL_IN], signup: 'Via Cuelinks / Admitad' },
  }),
  cleartrip: def({
    id: 'cleartrip',
    name: 'Cleartrip',
    category: 'travel',
    regions: ['in'],
    color: '#f77728',
    mono: 'ct',
    hosts: ['cleartrip.com'],
    android: 'com.cleartrip.android',
    aliases: ['cleartrip', 'clear trip'],
    intents: {
      home: () => 'https://www.cleartrip.com/',
      hotel: (p) => {
        const city = text(p.city ?? p.q);
        if (!city) return null;
        return `https://www.cleartrip.com/hotels/results?${qs({ city, chk_in: dmy(p.checkin), chk_out: dmy(p.checkout), adults1: adults(p), num_rooms: 1 })}`;
      },
      flight: (p) => {
        const from = iata(p.from);
        const to = iata(p.to);
        const d = dmy(p.date);
        if (!from || !to || !d) return null;
        return `https://www.cleartrip.com/flights/results?${qs({ adults: adults(p), childs: 0, infants: 0, class: 'Economy', depart_date: d, from, to })}`;
      },
    },
    affiliate: { networks: [...NETWORK_TRAVEL_IN], signup: 'Via Cuelinks / Admitad' },
  }),
  skyscanner: def({
    id: 'skyscanner',
    name: 'Skyscanner',
    category: 'travel',
    regions: ['in', 'global'],
    color: '#0770e3',
    mono: 'Sk',
    hosts: ['skyscanner.co.in', 'skyscanner.net', 'skyscanner.com'],
    android: 'net.skyscanner.android.main',
    aliases: ['skyscanner', 'sky scanner'],
    intents: {
      home: () => 'https://www.skyscanner.co.in/',
      flight: (p) => {
        const from = iata(p.from);
        const to = iata(p.to);
        const d = ymd(p.date);
        if (!from || !to || !d) return null;
        return `https://www.skyscanner.co.in/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${d[0].slice(2)}${d[1]}${d[2]}/?${qs({ adultsv2: adults(p) })}`;
      },
    },
    affiliate: {
      networks: ['impact', 'travelpayouts'],
      signup: 'Skyscanner partner programme (Impact) or Travelpayouts',
    },
  }),
  aviasales: def({
    id: 'aviasales',
    name: 'Aviasales',
    category: 'travel',
    regions: ['global'],
    color: '#0c73fe',
    mono: 'Av',
    hosts: ['aviasales.com'],
    aliases: ['aviasales'],
    intents: {
      home: () => 'https://www.aviasales.com/',
      flight: (p) => {
        const from = iata(p.from);
        const to = iata(p.to);
        const d = ymd(p.date);
        if (!from || !to || !d) return null;
        return `https://www.aviasales.com/search/${from}${d[2]}${d[1]}${to}${adults(p)}`;
      },
    },
    affiliate: { networks: ['travelpayouts'], signup: 'Travelpayouts (Aviasales is its flagship programme)' },
  }),
  klook: def({
    id: 'klook',
    name: 'Klook',
    category: 'travel',
    regions: ['in', 'global'],
    color: '#ff5722',
    mono: 'K',
    hosts: ['klook.com'],
    android: 'com.klook',
    aliases: ['klook'],
    intents: {
      home: () => 'https://www.klook.com/en-IN/',
      experience: (p) => {
        const q = text(p.q ?? p.city);
        return q ? `https://www.klook.com/en-IN/search/result/?${qs({ query: q })}` : null;
      },
    },
    affiliate: {
      param: { name: 'aid', env: 'KLOOK_AID' },
      networks: ['travelpayouts'],
      signup: 'https://affiliate.klook.com/ (or via Travelpayouts)',
    },
  }),
  getyourguide: def({
    id: 'getyourguide',
    name: 'GetYourGuide',
    category: 'travel',
    regions: ['global'],
    color: '#ff5533',
    mono: 'GY',
    hosts: ['getyourguide.com'],
    android: 'com.getyourguide.android',
    aliases: ['getyourguide', 'get your guide', 'gyg'],
    intents: {
      home: () => 'https://www.getyourguide.com/',
      experience: (p) => {
        const q = text(p.q ?? p.city);
        return q ? `https://www.getyourguide.com/s/?${qs({ q })}` : null;
      },
    },
    affiliate: {
      param: { name: 'partner_id', env: 'GETYOURGUIDE_PARTNER_ID', sub: 'cmp' },
      networks: ['travelpayouts'],
      signup: 'https://partner.getyourguide.com/ (or via Travelpayouts)',
    },
  }),

  // ---------------------------------------------------------------- food (deep link only)
  swiggy: def({
    id: 'swiggy',
    name: 'Swiggy',
    category: 'food',
    regions: ['in'],
    color: '#fc8019',
    mono: 'S',
    hosts: ['swiggy.com'],
    android: 'in.swiggy.android',
    aliases: ['swiggy'],
    intents: {
      home: () => 'https://www.swiggy.com/',
      food: searchAt('https://www.swiggy.com/search', 'query'),
    },
    affiliate: { none: NO_PROGRAM },
  }),
  zomato: def({
    id: 'zomato',
    name: 'Zomato',
    category: 'food',
    regions: ['in'],
    color: '#e23744',
    mono: 'z',
    hosts: ['zomato.com'],
    android: 'com.application.zomato',
    aliases: ['zomato'],
    intents: {
      home: () => 'https://www.zomato.com/',
      // dish pages exist per city: zomato.com/bangalore/delivery/dish-biryani (city defaults to Bengaluru)
      food: (p) => {
        const dish = slug(p.q);
        return dish ? `https://www.zomato.com/${slug(p.city) ?? 'bangalore'}/delivery/dish-${dish}` : null;
      },
    },
    affiliate: { none: NO_PROGRAM },
  }),

  // ---------------------------------------------------------------- grocery
  instamart: def({
    id: 'instamart',
    name: 'Swiggy Instamart',
    category: 'grocery',
    regions: ['in'],
    color: '#fc8019',
    mono: 'IM',
    short: 'Instamart',
    delivery: 'quick',
    hosts: ['swiggy.com'],
    android: 'in.swiggy.android',
    aliases: ['instamart', 'swiggy instamart'],
    intents: {
      home: () => 'https://www.swiggy.com/instamart',
      grocery: searchAt('https://www.swiggy.com/instamart/search', 'query'),
      cart: () => 'https://www.swiggy.com/instamart',
    },
    // best-effort app scheme (unverified): falls back to the web URL
    scheme: { cart: () => 'swiggy://instamart/cart' },
    affiliate: { none: NO_PROGRAM },
  }),
  blinkit: def({
    id: 'blinkit',
    name: 'Blinkit',
    category: 'grocery',
    regions: ['in'],
    color: '#f8cb46',
    mono: 'bl',
    ink: '#1c1c1c',
    delivery: 'quick',
    hosts: ['blinkit.com'],
    android: 'com.grofers.customerapp',
    aliases: ['blinkit', 'grofers'],
    intents: {
      home: () => 'https://blinkit.com/',
      grocery: searchAt('https://blinkit.com/s/', 'q'),
      cart: () => 'https://blinkit.com/',
    },
    scheme: { cart: () => 'blinkit://cart' },
    affiliate: { none: NO_PROGRAM },
  }),
  zepto: def({
    id: 'zepto',
    name: 'Zepto',
    category: 'grocery',
    regions: ['in'],
    color: '#5b1fa3',
    mono: 'Z',
    delivery: 'quick',
    hosts: ['zeptonow.com', 'zepto.com'],
    android: 'com.zeptoconsumerapp',
    aliases: ['zepto'],
    intents: {
      home: () => 'https://www.zeptonow.com/',
      grocery: searchAt('https://www.zeptonow.com/search', 'query'),
      cart: () => 'https://www.zeptonow.com/',
    },
    scheme: { cart: () => 'zepto://cart' },
    affiliate: { none: NO_PROGRAM },
  }),
  bigbasket: def({
    id: 'bigbasket',
    name: 'BigBasket',
    category: 'grocery',
    regions: ['in'],
    color: '#84c225',
    mono: 'bb',
    delivery: 'slot',
    hosts: ['bigbasket.com'],
    android: 'com.bigbasket.mobileapp',
    aliases: ['bigbasket', 'big basket', 'bb'],
    intents: {
      home: () => 'https://www.bigbasket.com/',
      grocery: searchAt('https://www.bigbasket.com/ps/', 'q'),
      cart: () => 'https://www.bigbasket.com/basket/',
    },
    scheme: { cart: () => 'bigbasket://basket' },
    affiliate: { networks: ['cuelinks', 'admitad'], signup: 'Via Cuelinks / Admitad' },
  }),
  'amazon-fresh': def({
    id: 'amazon-fresh',
    name: 'Amazon Fresh',
    category: 'grocery',
    regions: ['in'],
    color: '#3a9e3a',
    mono: 'aF',
    delivery: 'slot',
    hosts: ['amazon.in'],
    android: 'in.amazon.mShop.android.shopping',
    aliases: ['amazon fresh', 'amazonfresh'],
    intents: {
      home: () => 'https://www.amazon.in/alm/storefront?almBrandId=ctnow',
      grocery: (p) => {
        const q = text(p.q);
        return q ? `https://www.amazon.in/s?${qs({ i: 'nowstore', k: q })}` : null;
      },
      cart: () => 'https://www.amazon.in/alm/storefront?almBrandId=ctnow',
    },
    scheme: { cart: () => 'amazon://fresh/cart' },
    affiliate: { param: { name: 'tag', env: 'AMAZON_TAG_IN' }, signup: 'Amazon Associates (India)' },
  }),

  // ---------------------------------------------------------------- rides (deep link only)
  uber: def({
    id: 'uber',
    name: 'Uber',
    category: 'ride',
    regions: ['in', 'global'],
    color: '#000000',
    mono: 'U',
    hosts: ['uber.com', 'm.uber.com'],
    android: 'com.ubercab',
    aliases: ['uber'],
    intents: {
      home: () => 'https://m.uber.com/ul/',
      ride: (p) => `https://m.uber.com/ul/?${uberQuery(p)}`,
    },
    // documented Uber deep link scheme (developer.uber.com "Ride Requests" deep links)
    scheme: { ride: (p) => `uber://?${uberQuery(p)}` },
    affiliate: { none: NO_PROGRAM },
  }),
  ola: def({
    id: 'ola',
    name: 'Ola',
    category: 'ride',
    regions: ['in'],
    color: '#1c1c1c',
    mono: 'O',
    hosts: ['olacabs.com', 'book.olacabs.com'],
    android: 'com.olacabs.customer',
    aliases: ['ola', 'ola cabs'],
    intents: {
      home: () => 'https://book.olacabs.com/',
      ride: (p) =>
        `https://book.olacabs.com/?${qs({ serviceType: 'p2p', drop_lat: coord(p.lat, 90), drop_lng: coord(p.lng, 180), drop_name: text(p.dropoff) })}`,
    },
    affiliate: { none: NO_PROGRAM },
  }),

  // ---------------------------------------------------------------- messaging (Future Message one-tap send)
  whatsapp: def({
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'messaging',
    regions: ['in', 'global'],
    color: '#25d366',
    mono: 'W',
    hosts: ['wa.me'],
    android: 'com.whatsapp',
    aliases: ['whatsapp', 'wa'],
    intents: {
      // click-to-chat; with no number WhatsApp asks who to send to
      message: (p) =>
        `https://wa.me/${(p.phone ?? '').replace(/\D/g, '')}?${qs({ text: text(p.text, 4000) ?? '' })}`.replace(
          /\?$/,
          '',
        ),
    },
    affiliate: { none: 'Messaging: no affiliate programme.' },
  }),
  signal: def({
    id: 'signal',
    name: 'Signal',
    category: 'messaging',
    regions: ['global'],
    color: '#3a76f0',
    mono: 'Si',
    hosts: ['signal.me'],
    android: 'org.thoughtcrime.securesms',
    aliases: ['signal'],
    intents: { message: () => 'https://signal.org/download/' },
    scheme: { message: (p) => `sgnl://send?${qs({ text: text(p.text, 4000) ?? '' })}` },
    affiliate: { none: 'Messaging: no affiliate programme.' },
  }),
  sms: def({
    id: 'sms',
    name: 'SMS',
    category: 'messaging',
    regions: ['in', 'global'],
    color: '#4caf50',
    mono: 'SMS',
    hosts: [],
    aliases: ['sms', 'text message'],
    intents: {
      message: (p) => `sms:${(p.phone ?? '').replace(/[^\d+]/g, '')}?${qs({ body: text(p.text, 4000) ?? '' })}`,
    },
    affiliate: { none: 'Messaging: no affiliate programme.' },
  }),
} satisfies Record<string, PlatformDef>;

function uberQuery(p: LinkParams): string {
  return qs({
    action: 'setPickup',
    pickup: 'my_location',
    'dropoff[formatted_address]': text(p.dropoff),
    'dropoff[latitude]': coord(p.lat, 90),
    'dropoff[longitude]': coord(p.lng, 180),
  });
}

export type PlatformId = keyof typeof PLATFORMS;
export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[];

export function getPlatform(id: string): PlatformDef | undefined {
  return (PLATFORMS as Record<string, PlatformDef>)[id];
}

export function platformsBy(category: PlatformDef['category']): PlatformDef[] {
  return Object.values(PLATFORMS as Record<string, PlatformDef>).filter((p) => p.category === category);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * Resolve a free-form store / advertiser name or URL to a platform ("Booking.com", "MakeMyTrip IN CPS",
 * "https://www.agoda.com/..."). Used by earnings importers; returns undefined when nothing matches.
 */
export function findPlatform(nameOrUrl: string): PlatformDef | undefined {
  const all = Object.values(PLATFORMS as Record<string, PlatformDef>);
  try {
    const host = new URL(nameOrUrl).hostname.replace(/^www\./, '');
    const byHost = all.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`)));
    if (byHost) return byHost;
  } catch {
    /* not a URL */
  }
  const n = norm(nameOrUrl);
  if (!n) return undefined;
  const exact = all.find((p) => norm(p.name) === n || norm(p.id) === n || p.aliases.some((a) => norm(a) === n));
  if (exact) return exact;
  // longest name / alias that prefixes the input ("makemytripincps" → makemytrip)
  let best: { p: PlatformDef; len: number } | undefined;
  for (const p of all)
    for (const key of [p.name, p.id, ...p.aliases].map(norm))
      if (key.length >= 4 && n.startsWith(key) && key.length > (best?.len ?? 0)) best = { p, len: key.length };
  return best?.p;
}
