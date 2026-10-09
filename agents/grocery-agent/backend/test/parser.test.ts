import { describe, expect, it } from 'vitest';
import { formatQty, parseList } from '../src/engine/listParser.js';

const keyed = (t: string) => Object.fromEntries(parseList(t).items.map((i) => [i.key, i]));

describe('list parser (EN / HI / Hinglish)', () => {
  it('parses the canonical example', () => {
    const r = keyed('2 kg aata, 1 L Amul milk, 6 eggs');
    expect(r.atta).toMatchObject({ qty: 2000, unit: 'g' });
    expect(r.milk).toMatchObject({ qty: 1000, unit: 'ml', brand: 'Amul' });
    expect(r.eggs).toMatchObject({ qty: 6, unit: 'pc' });
  });
  it('understands Hinglish number words, dozen and "aur"', () => {
    const r = keyed('aadha kilo pyaz aur ek darjan ande');
    expect(r.onion).toMatchObject({ qty: 500, unit: 'g' });
    expect(r.eggs.qty).toBe(12);
    expect(r.eggs.display).toBe('1 dozen');
  });
  it('handles Devanagari and fractions', () => {
    const r = keyed('दो किलो आटा, 1/2 kg tamatar, dedh litre doodh');
    expect(r.atta.qty).toBe(2000);
    expect(r.tomato.qty).toBe(500);
    expect(r.milk.qty).toBe(1500);
  });
  it('detects variants and merges duplicates', () => {
    const r = parseList('sarson ka tel, 1 kg pyaz, 1 kg onion');
    const oil = r.items.find((i) => i.key === 'oil')!;
    expect(oil.variant).toBe('Mustard');
    expect(r.items.filter((i) => i.key === 'onion')).toHaveLength(1);
    expect(r.items.find((i) => i.key === 'onion')!.qty).toBe(2000);
  });
  it('reports unknown items instead of guessing', () => {
    const r = parseList('2 kg aata, nutella');
    expect(r.unknown).toContain('nutella');
  });
  it('formats quantities', () => {
    expect(formatQty(1500, 'g')).toBe('1.5 kg');
    expect(formatQty(500, 'ml')).toBe('500 ml');
    expect(formatQty(12, 'pc', true)).toBe('1 dozen');
  });
});
