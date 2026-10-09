import { describe, expect, it } from 'vitest';
import { budgetTips, buildPlans, feeTotal, linesFor, packCombo, quoteStore } from '../src/engine/optimizer.js';
import { parseList } from '../src/engine/listParser.js';
import { MockStoreProvider } from '../src/providers/mock.js';
import { StoreId, type Sku } from '../src/types.js';

const sku = (id: string, size: number, price: number, extra: Partial<Sku> = {}): Sku => ({
  id, store: 'zepto', itemKey: 'atta', name: `Atta ${id}`, brand: 'Aashirvaad', size, unit: 'g', sizeLabel: `${size} g`, price, mrp: price, inStock: true, emoji: '🌾', sample: true, ...extra,
});

describe('packCombo', () => {
  it('prefers the bigger pack when it is cheaper per kg', () => {
    const c = packCombo([sku('1kg', 1000, 70), sku('5kg', 5000, 260)], 4000)!;
    expect(c.parts.map((p) => p.sku.id)).toEqual(['5kg']);
    expect(c.price).toBe(260);
  });
  it('mixes two pack sizes to avoid waste', () => {
    const c = packCombo([sku('1kg', 1000, 60), sku('500g', 500, 32)], 1500)!;
    expect(c.covered).toBe(1500);
    expect(c.price).toBe(92);
  });
  it('ignores out-of-stock packs', () => {
    expect(packCombo([sku('a', 1000, 10, { inStock: false })], 1000)).toBeNull();
  });
});

async function quoteAll(text: string) {
  const { items } = parseList(text);
  const inputs = await Promise.all(
    StoreId.options.map(async (store) => {
      const p = new MockStoreProvider(store, 0);
      const svc = await p.serviceability('560034', new Date('2026-10-09T08:00:00Z'));
      return { store, serviceable: true, sample: true, skus: await p.findSkus(items), fees: (s: number) => p.fees(s), etaMin: svc.etaMin, etaLabel: svc.etaLabel };
    }),
  );
  const quotes = inputs.map((i) => quoteStore(items, i as never));
  return { items, inputs, quotes };
}

describe('basket optimizer (mock catalogue)', () => {
  const list = '2 kg aata, 1 L Amul milk, 6 eggs, 1 kg pyaz, 500g tamatar, 1 kg toor dal, 200 g paneer';

  it('quotes every store, fees included, totals consistent', async () => {
    const { quotes } = await quoteAll(list);
    expect(quotes).toHaveLength(5);
    for (const q of quotes) {
      const sub = q.lines.reduce((a, l) => a + l.price, 0);
      expect(q.subtotal).toBe(sub);
      expect(q.total).toBe(sub + feeTotal(q.fees));
    }
  });

  it('cheapest plan is the minimum full-coverage total; fastest has the smallest ETA', async () => {
    const { items, inputs, quotes } = await quoteAll(list);
    const { plans } = buildPlans(items, quotes, inputs as never);
    const cheapest = plans.find((p) => p.strategy === 'cheapest')!;
    const fastest = plans.find((p) => p.strategy === 'fastest')!;
    const full = quotes.filter((q) => !q.missing.length);
    expect(cheapest.total).toBe(Math.min(...full.map((q) => q.total)));
    expect(fastest.etaMin).toBe(Math.min(...full.map((q) => q.etaMin)));
    expect(plans.some((p) => p.strategy === 'balanced')).toBe(true);
  });

  it('a split plan is only offered when it actually saves money', async () => {
    const { items, inputs, quotes } = await quoteAll(list);
    const { plans, splitNote } = buildPlans(items, quotes, inputs as never);
    const split = plans.find((p) => p.strategy === 'split');
    const cheapest = plans.find((p) => p.strategy === 'cheapest')!;
    if (split) {
      expect(split.parts.length).toBeGreaterThan(1);
      expect(split.total).toBeLessThanOrEqual(cheapest.total - 20);
    } else expect(splitNote).toBeTruthy();
  });

  it('budget: flags over-budget plans and suggests tips', async () => {
    const { items, inputs, quotes } = await quoteAll('5 kg Aashirvaad atta, 2 L Amul milk, 1 L Fortune oil, 500 g Amul butter');
    const { plans } = buildPlans(items, quotes, inputs as never, { budget: 200 });
    expect(plans.every((p) => p.overBudget)).toBe(true);
    const tips = budgetTips(plans[0], items, 200);
    expect(tips.length).toBeGreaterThan(0);
    for (const t of tips) expect(t.save).toBeGreaterThan(0);
    expect(budgetTips(plans[0], items, 100000)).toEqual([]);
  });

  it('substitutes another brand when the wanted brand is missing, and says why', () => {
    const item = parseList('1 L Amul milk').items[0];
    const lines = linesFor(item, [sku('m1', 500, 30, { itemKey: 'milk', brand: 'Nandini', unit: 'ml', name: 'Nandini Milk' })], 'zepto')!;
    expect(lines[0].substitution?.reason).toMatch(/Amul/);
    expect(lines[0].sku.brand).toBe('Nandini');
  });
});
