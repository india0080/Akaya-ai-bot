import { describe, expect, it } from 'vitest';
import {
  LinkError,
  NETWORKS,
  PLATFORMS,
  PLATFORM_IDS,
  buildLink,
  getPlatform,
  tryBuildLink,
  type Intent,
  type PlatformDef,
} from '../src/index.js';
import { ENV, SAMPLE } from './fixtures.js';

const all = PLATFORM_IDS.map((id) => getPlatform(id)!) as PlatformDef[];
const cases = all.flatMap((p) => (Object.keys(p.intents) as Intent[]).map((intent) => [p.id, intent] as const));

describe('every platform × intent builds a safe link', () => {
  it.each(cases)('%s / %s', (platform, intent) => {
    const plat = getPlatform(platform)!;
    const plain = buildLink({
      platform,
      intent,
      params: SAMPLE[intent],
      campaign: 'Test Campaign!',
      content: 'card/book',
    });
    const tracked = buildLink({
      platform,
      intent,
      params: SAMPLE[intent],
      campaign: 'test',
      content: 'card',
      env: ENV,
    });

    for (const l of [plain, tracked]) {
      // web URL: parseable, https (or sms: for SMS), no raw spaces/quotes/emoji
      expect(() => new URL(l.webUrl)).not.toThrow();
      if (plat.category !== 'messaging') expect(new URL(l.webUrl).protocol).toBe('https:');
      expect(l.webUrl).not.toMatch(/[\s"<>]/);
      expect(l.trackedUrl).not.toMatch(/[\s"<>]/);
      expect(l.webUrl).not.toMatch(/utm_|tag=akaya|aid=1234567/);
      if (l.appUri) expect(l.appUri).toMatch(/^[a-z]+:/);
      expect(l.androidPackage).toBe(plat.android ?? null);
    }

    if (plat.category === 'messaging') {
      expect(plain.trackedUrl).toBe(plain.webUrl);
      expect(tracked.affiliate.active).toBe(false);
      return;
    }
    // UTM on the plain link: utm_source=akaya, utm_medium=app, cleaned campaign/content
    const u = new URL(plain.trackedUrl);
    expect(u.searchParams.get('utm_source')).toBe('akaya');
    expect(u.searchParams.get('utm_medium')).toBe('app');
    expect(u.searchParams.get('utm_campaign')).toBe('test-campaign');
    expect(u.searchParams.get('utm_content')).toBe('card-book');
    expect(plain.affiliate).toEqual({ active: false, via: null });

    // with IDs: active exactly when the platform has a configured programme
    const configured =
      !!plat.affiliate.param ||
      (plat.affiliate.networks ?? []).some((n) =>
        NETWORKS[n].wrap('https://x.test/', { platform, env: ENV, sub: null }),
      );
    expect(tracked.affiliate.active).toBe(configured);
    if (plat.affiliate.none) expect(tracked.affiliate.active).toBe(false);
  });
});

describe('platform specifics', () => {
  it('Amazon: tag per marketplace, ASIN product, search', () => {
    const l = buildLink({
      platform: 'amazon',
      intent: 'product',
      params: { id: 'B0CX23V2ZK' },
      campaign: 'deals',
      env: ENV,
    });
    expect(l.webUrl).toBe('https://www.amazon.in/dp/B0CX23V2ZK');
    const u = new URL(l.trackedUrl);
    expect(u.searchParams.get('tag')).toBe('akaya-21');
    expect(l.affiliate.via).toBe('param:tag');
    const us = buildLink({ platform: 'amazon', intent: 'search', params: { q: 'usb c hub', market: 'us' }, env: ENV });
    expect(us.webUrl).toBe('https://www.amazon.com/s?k=usb%20c%20hub');
    expect(new URL(us.trackedUrl).searchParams.get('tag')).toBe('akaya-20');
    // no UK tag configured → plain link with UTM
    const uk = buildLink({ platform: 'amazon', intent: 'search', params: { q: 'kettle', market: 'uk' }, env: ENV });
    expect(uk.affiliate.active).toBe(false);
    expect(uk.trackedUrl).toContain('amazon.co.uk/s?k=kettle&utm_source=akaya');
  });
  it('Flipkart: affid + affExtParam1 sub-id', () => {
    const l = buildLink({
      platform: 'flipkart',
      intent: 'search',
      params: { q: 'redmi note' },
      content: 'deals-tab',
      env: ENV,
    });
    const u = new URL(l.trackedUrl);
    expect(u.hostname).toBe('www.flipkart.com');
    expect(u.searchParams.get('affid')).toBe('akayafk');
    expect(u.searchParams.get('affExtParam1')).toBe('deals-tab');
  });
  it('network merchants (Myntra) are wrapped by Cuelinks with the store URL encoded', () => {
    const l = buildLink({
      platform: 'myntra',
      intent: 'search',
      params: { q: 'Running Shoes' },
      campaign: 'deals',
      env: ENV,
    });
    expect(l.webUrl).toBe('https://www.myntra.com/running-shoes');
    const u = new URL(l.trackedUrl);
    expect(u.hostname).toBe('linksredirect.com');
    expect(u.searchParams.get('cid')).toBe('98765');
    const inner = new URL(u.searchParams.get('url')!);
    expect(inner.hostname).toBe('www.myntra.com');
    expect(inner.searchParams.get('utm_campaign')).toBe('deals');
    expect(l.affiliate.via).toBe('network:cuelinks');
  });
  it('Admitad is used when Cuelinks is absent and an offer code is set', () => {
    const l = buildLink({
      platform: 'nykaa',
      intent: 'search',
      params: { q: 'lipstick' },
      env: { ADMITAD_CODE_NYKAA: 'abc123' },
    });
    expect(l.trackedUrl.startsWith('https://ad.admitad.com/g/abc123/?ulp=https%3A%2F%2Fwww.nykaa.com')).toBe(true);
  });
  it('Booking.com hotel search with dates, aid and label', () => {
    const l = buildLink({
      platform: 'booking',
      intent: 'hotel',
      params: SAMPLE.hotel,
      campaign: 'travel-goa',
      env: ENV,
    });
    const u = new URL(l.trackedUrl);
    expect(u.pathname).toBe('/searchresults.html');
    expect(u.searchParams.get('ss')).toBe('North Goa');
    expect(u.searchParams.get('checkin')).toBe('2026-12-20');
    expect(u.searchParams.get('checkout')).toBe('2026-12-23');
    expect(u.searchParams.get('group_adults')).toBe('2');
    expect(u.searchParams.get('aid')).toBe('1234567');
    expect(u.searchParams.get('label')).toBe('travel-goa');
  });
  it('MakeMyTrip / Cleartrip / Goibibo / Skyscanner / Aviasales flight URL formats', () => {
    const f = SAMPLE.flight;
    expect(buildLink({ platform: 'makemytrip', intent: 'flight', params: f }).webUrl).toContain(
      'itinerary=DEL-GOI-20%2F12%2F2026',
    );
    expect(buildLink({ platform: 'cleartrip', intent: 'flight', params: f }).webUrl).toContain(
      'depart_date=20%2F12%2F2026&from=DEL&to=GOI',
    );
    expect(buildLink({ platform: 'goibibo', intent: 'flight', params: f }).webUrl).toBe(
      'https://www.goibibo.com/flights/air-DEL-GOI-20261220--1-0-0-E-D/',
    );
    expect(buildLink({ platform: 'skyscanner', intent: 'flight', params: f }).webUrl).toBe(
      'https://www.skyscanner.co.in/transport/flights/del/goi/261220/?adultsv2=1',
    );
    const av = buildLink({ platform: 'aviasales', intent: 'flight', params: f, env: ENV });
    expect(av.webUrl).toBe('https://www.aviasales.com/search/DEL2012GOI1');
    expect(av.trackedUrl).toMatch(/^https:\/\/tp\.media\/r\?marker=555555&p=4114&u=https%3A%2F%2Fwww\.aviasales\.com/);
  });
  it('Expedia flight leg format and CJ deep link', () => {
    const l = buildLink({ platform: 'expedia', intent: 'flight', params: SAMPLE.flight, content: 'card', env: ENV });
    expect(new URL(l.webUrl).searchParams.get('leg1')).toBe('from:DEL,to:GOI,departure:12/20/2026TANYT');
    expect(
      l.trackedUrl.startsWith(
        'https://www.anrdoezrs.net/links/1010101/type/dlg/sid/card/https://www.expedia.com/Flights-Search?',
      ),
    ).toBe(true);
  });
  it('Klook prefers its direct aid; GetYourGuide partner_id + cmp', () => {
    expect(
      new URL(
        buildLink({ platform: 'klook', intent: 'experience', params: { q: 'Bali' }, env: ENV }).trackedUrl,
      ).searchParams.get('aid'),
    ).toBe('45678');
    const g = new URL(
      buildLink({ platform: 'getyourguide', intent: 'experience', params: { q: 'Rome' }, campaign: 'x', env: ENV })
        .trackedUrl,
    );
    expect(g.searchParams.get('partner_id')).toBe('AKAYA123');
    expect(g.searchParams.get('cmp')).toBe('x');
  });
  it('Swiggy / Zomato / Blinkit / Zepto are deep-link only', () => {
    const s = buildLink({ platform: 'swiggy', intent: 'food', params: { q: 'chicken biryani' }, env: ENV });
    expect(s.webUrl).toBe('https://www.swiggy.com/search?query=chicken%20biryani');
    expect(s.affiliate.active).toBe(false);
    expect(
      buildLink({ platform: 'zomato', intent: 'food', params: { q: 'Paneer Tikka', city: 'Mumbai' } }).webUrl,
    ).toBe('https://www.zomato.com/mumbai/delivery/dish-paneer-tikka');
    expect(buildLink({ platform: 'blinkit', intent: 'grocery', params: { q: 'eggs' } }).webUrl).toBe(
      'https://blinkit.com/s/?q=eggs',
    );
    expect(buildLink({ platform: 'zepto', intent: 'cart' }).appUri).toBe('zepto://cart');
    expect(PLATFORMS.swiggy.affiliate.none).toMatch(/partnership TODO/);
  });
  it('Uber uses the documented scheme + universal link; Ola book link with coordinates', () => {
    const u = buildLink({ platform: 'uber', intent: 'ride', params: { dropoff: 'Airport T2' } });
    expect(u.appUri).toBe('uber://?action=setPickup&pickup=my_location&dropoff%5Bformatted_address%5D=Airport%20T2');
    expect(u.webUrl.startsWith('https://m.uber.com/ul/?action=setPickup')).toBe(true);
    const o = buildLink({ platform: 'ola', intent: 'ride', params: SAMPLE.ride });
    expect(o.webUrl).toBe(
      'https://book.olacabs.com/?serviceType=p2p&drop_lat=13.198600&drop_lng=77.706600&drop_name=Kempegowda%20Airport%20T2',
    );
  });
  it('messaging deep links (Future Message one-tap send)', () => {
    expect(
      buildLink({ platform: 'whatsapp', intent: 'message', params: { phone: '+91 98200 00001', text: 'Hi Priya' } })
        .webUrl,
    ).toBe('https://wa.me/919820000001?text=Hi%20Priya');
    expect(buildLink({ platform: 'whatsapp', intent: 'message', params: { text: 'Hi' } }).webUrl).toBe(
      'https://wa.me/?text=Hi',
    );
    expect(buildLink({ platform: 'signal', intent: 'message', params: { text: 'Hi' } }).appUri).toBe(
      'sgnl://send?text=Hi',
    );
    expect(
      buildLink({ platform: 'sms', intent: 'message', params: { phone: '+91 98200-00001', text: 'On my way' } }).webUrl,
    ).toBe('sms:+919820000001?body=On%20my%20way');
  });
});

describe('safety', () => {
  it('rejects unknown platforms, unsupported intents and missing params', () => {
    expect(() => buildLink({ platform: 'nope', intent: 'search' })).toThrow(LinkError);
    expect(() => buildLink({ platform: 'swiggy', intent: 'flight', params: SAMPLE.flight })).toThrow(
      /does not support/,
    );
    expect(() => buildLink({ platform: 'booking', intent: 'hotel', params: {} })).toThrow(/missing or invalid/);
    expect(tryBuildLink({ platform: 'booking', intent: 'hotel', params: {} })).toBeNull();
  });
  it('product URLs must be https on the platform host (no open redirect)', () => {
    expect(() =>
      buildLink({ platform: 'flipkart', intent: 'product', params: { url: 'https://evil.example/flipkart.com' } }),
    ).toThrow(LinkError);
    expect(() =>
      buildLink({ platform: 'flipkart', intent: 'product', params: { url: 'http://www.flipkart.com/x' } }),
    ).toThrow(LinkError);
    expect(() =>
      buildLink({ platform: 'flipkart', intent: 'product', params: { url: 'https://www.flipkart.com.evil.example/' } }),
    ).toThrow(LinkError);
    expect(
      buildLink({
        platform: 'flipkart',
        intent: 'product',
        params: { url: 'https://www.flipkart.com/x/p/itm1?pid=ABC' },
      }).webUrl,
    ).toBe('https://www.flipkart.com/x/p/itm1?pid=ABC');
  });
  it('ignores malformed IDs, dates and IATA codes', () => {
    expect(
      buildLink({ platform: 'amazon', intent: 'search', params: { q: 'x' }, env: { AMAZON_TAG_IN: 'bad tag&x=1' } })
        .affiliate.active,
    ).toBe(false);
    expect(() =>
      buildLink({ platform: 'cleartrip', intent: 'flight', params: { from: 'DELHI', to: 'GOI', date: '2026-12-20' } }),
    ).toThrow();
    expect(() =>
      buildLink({ platform: 'cleartrip', intent: 'flight', params: { from: 'DEL', to: 'GOI', date: '2026-02-30' } }),
    ).toThrow();
    expect(
      buildLink({ platform: 'booking', intent: 'hotel', params: { city: 'Goa', checkin: '20/12/2026' } }).webUrl,
    ).not.toContain('checkin');
    expect(() => buildLink({ platform: 'amazon', intent: 'product', params: { id: '../../etc' } })).toThrow(LinkError);
  });
  it('strips control characters and caps query length', () => {
    const l = buildLink({ platform: 'swiggy', intent: 'food', params: { q: `biryani\u0000\n${'x'.repeat(500)}` } });
    expect(decodeURIComponent(new URL(l.webUrl).searchParams.get('query')!).length).toBeLessThanOrEqual(200);
    expect(l.webUrl).not.toMatch(/%00|%0A/);
  });
});
