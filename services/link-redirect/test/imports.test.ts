import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ADAPTERS } from '../src/imports/index.js';
import { parseCsv } from '../src/imports/csv.js';
import { auth, makeApp } from './helpers.js';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}.csv`, import.meta.url), 'utf8');

describe('CSV reader', () => {
  it('quotes, escaped quotes, CRLF and BOM', () => {
    expect(parseCsv('\uFEFFa,b\r\n"x, y","say ""hi"""\r\n\r\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
    ]);
  });
});

describe('earnings adapters', () => {
  it('Amazon Associates: title line skipped, returns subtracted, zero rows dropped', () => {
    const rows = ADAPTERS['amazon-associates'].parseCsv(fixture('amazon-associates'));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      source: 'amazon-associates',
      platform: 'amazon',
      date: '2026-09-03',
      campaign: 'akaya-21',
      orders: 2,
      sales: 2998,
      commission: 104.93,
      currency: 'INR',
      status: 'approved',
    });
  });
  it('Admitad: advertiser names resolve to platforms; statuses map', () => {
    const rows = ADAPTERS.admitad.parseCsv(fixture('admitad'));
    expect(rows.map((r) => [r.externalId, r.platform, r.status])).toEqual([
      ['900001', 'myntra', 'approved'],
      ['900002', 'ajio', 'pending'],
      ['900003', 'makemytrip', 'rejected'],
    ]);
    expect(rows[0]).toMatchObject({ date: '2026-09-05', sales: 2499, commission: 149.94, campaign: 'shopping-card' });
  });
  it('Cuelinks: DD/MM dates and thousands separators', () => {
    const rows = ADAPTERS.cuelinks.parseCsv(fixture('cuelinks'));
    expect(rows[1]).toMatchObject({
      externalId: 'CL-1002',
      platform: 'croma',
      date: '2026-09-12',
      sales: 18990,
      commission: 189.9,
      status: 'pending',
    });
    expect(rows[0].status).toBe('approved');
  });
  it('Travelpayouts: USD programmes', () => {
    const rows = ADAPTERS.travelpayouts.parseCsv(fixture('travelpayouts'));
    expect(rows.map((r) => [r.platform, r.currency, r.status])).toEqual([
      ['aviasales', 'USD', 'approved'],
      ['klook', 'USD', 'pending'],
    ]);
  });
  it('Booking.com: EUR commission column with a currency suffix', () => {
    const rows = ADAPTERS.booking.parseCsv(fixture('booking'));
    expect(rows[0]).toMatchObject({
      externalId: '4123000001',
      platform: 'booking',
      commission: 12.48,
      currency: 'EUR',
      status: 'approved',
      campaign: 'akaya-hotel-card',
    });
    expect(rows[1].status).toBe('rejected');
  });
  it('a CSV without the expected columns is rejected', () => {
    expect(() => ADAPTERS.cuelinks.parseCsv('foo,bar\n1,2')).toThrow(/header not found/);
  });
});

describe('imports + reports API', () => {
  it('upload CSVs, re-upload is idempotent, report rolls up clicks and commission', async () => {
    const { app } = makeApp();
    const csv = (source: string) =>
      app.inject({
        method: 'POST',
        url: `/imports/${source}`,
        headers: { ...auth, 'content-type': 'text/csv' },
        payload: fixture(source),
      });
    expect((await csv('amazon-associates')).json()).toEqual({
      source: 'amazon-associates',
      rows: 2,
      added: 2,
      updated: 0,
    });
    expect((await csv('amazon-associates')).json()).toMatchObject({ added: 0, updated: 2 });
    await csv('admitad');
    await csv('booking');

    const link = (
      await app.inject({
        method: 'POST',
        url: '/links',
        headers: auth,
        payload: { platform: 'amazon', intent: 'search', params: { q: 'earbuds' } },
      })
    ).json();
    for (let i = 0; i < 4; i++) await app.inject({ method: 'GET', url: `/go/${link.id}` });

    const r = (
      await app.inject({ method: 'GET', url: '/reports?from=2026-09-01&to=2026-10-31', headers: auth })
    ).json();
    expect(r.currency).toBe('INR');
    const amazon = r.platforms.find((p: { platform: string }) => p.platform === 'amazon');
    expect(amazon).toMatchObject({ clicks: 4, orders: 3, commission: 128.87 });
    expect(r.totals.pending).toBe(90);
    expect(r.otherCurrencyRows).toBe(1); // the stayed EUR Booking.com row (cancelled one is excluded)

    const eur = (await app.inject({ method: 'GET', url: '/reports?currency=EUR', headers: auth })).json();
    expect(eur.totals.commission).toBe(12.48);
    const sept = (await app.inject({ method: 'GET', url: '/reports?to=2026-09-30', headers: auth })).json();
    expect(sept.totals.clicks).toBe(0);
  });

  it('API sync stubs answer 501 with the missing env vars; unknown sources 422', async () => {
    const { app } = makeApp();
    const r = await app.inject({
      method: 'POST',
      url: '/imports/admitad/sync',
      headers: auth,
      payload: { from: '2026-09-01', to: '2026-09-30' },
    });
    expect(r.statusCode).toBe(501);
    expect(r.json().missing).toEqual(['ADMITAD_CLIENT_ID', 'ADMITAD_CLIENT_SECRET']);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/imports/amazon-associates/sync',
          headers: auth,
          payload: { from: '2026-09-01', to: '2026-09-30' },
        })
      ).json().error,
    ).toMatch(/no public earnings API/);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/imports/nope',
          headers: { ...auth, 'content-type': 'text/csv' },
          payload: 'a,b',
        })
      ).statusCode,
    ).toBe(422);
    expect((await app.inject({ method: 'GET', url: '/imports', headers: auth })).json()).toHaveLength(5);
  });
});
