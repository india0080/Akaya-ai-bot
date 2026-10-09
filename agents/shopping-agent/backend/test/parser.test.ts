import { describe, expect, it } from 'vitest';
import { parseQuery } from '../src/engine/queryParser.js';

describe('parseQuery (EN / HI / Hinglish)', () => {
  it('english max price', () => {
    const p = parseQuery('wireless earbuds under 3000');
    expect(p.q).toBe('wireless earbuds');
    expect(p.filters.maxPrice).toBe(3000);
    expect(p.lang).toBe('en');
  });
  it('hinglish "se kam" + synonym + urgency', () => {
    const p = parseQuery('1500 se kam ka basta jaldi chahiye');
    expect(p.q).toBe('school bag');
    expect(p.filters.maxPrice).toBe(1500);
    expect(p.filters.maxDeliveryDays).toBeLessThanOrEqual(2);
    expect(p.hints).toContain('fastest');
    expect(p.lang).toBe('hinglish');
  });
  it('k / hazaar multipliers and ranges', () => {
    expect(parseQuery('phone under 15k').filters.maxPrice).toBe(15000);
    const j = parseQuery('do hazaar tak ke joote');
    expect(j.filters.maxPrice).toBe(2000);
    expect(j.q).toBe('shoes');
    expect(parseQuery('dedh lakh se kam ka phone').filters.maxPrice).toBe(150000);
    expect(parseQuery('२ हज़ार तक की घड़ी').filters.maxPrice).toBe(2000);
    const r = parseQuery('smartwatch 2000 to 5000');
    expect(r.filters.minPrice).toBe(2000);
    expect(r.filters.maxPrice).toBe(5000);
  });
  it('Devanagari digits and Hindi words', () => {
    const p = parseQuery('१५०० से कम का बस्ता');
    expect(p.filters.maxPrice).toBe(1500);
    expect(p.q).toContain('bag');
    expect(p.lang).toBe('hi');
  });
  it('rating and store filters', () => {
    const p = parseQuery('mixer grinder 4 star on amazon or flipkart');
    expect(p.filters.minRating).toBe(4);
    expect(p.filters.stores).toEqual(expect.arrayContaining(['amazon', 'flipkart']));
    expect(p.q).toBe('mixer grinder');
  });
  it('cheapest / quality hints', () => {
    expect(parseQuery('sabse sasta power bank').hints).toContain('cheapest');
    expect(parseQuery('best quality running shoes').hints).toContain('quality');
    expect(parseQuery('sabse sasta power bank').q).toBe('power bank');
    expect(parseQuery('सस्ता पावर बैंक').q).toBe('power bank');
    expect(parseQuery('mixie 3000 se kam').q).toBe('mixer grinder');
  });
});
