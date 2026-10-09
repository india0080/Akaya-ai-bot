/**
 * Mock store provider (SAMPLE DATA): deterministic prices, stock, ETAs and fee rules per store so
 * the optimizer, cart flow and UI work end to end without any store account.
 * Fee rules and ETAs are illustrative. Check each store's app for real fees.
 */
import { rng } from '../lib/rng.js';
import { STORES, type Fees, type ParsedItem, type Sku, type StoreId } from '../types.js';
import { ITEMS, itemByKey } from './catalog.js';
import type { CartLineInput, FillProgress, FillResult, GroceryProvider, Serviceability } from './types.js';

interface StoreProfile {
  bias: number; // price multiplier
  produceBias: number;
  oos: number; // out-of-stock probability
  eta: [number, number] | 'slot2h' | 'slotEvening';
  fee: { freeAbove: number; delivery: number; handling: number; smallCartBelow: number; smallCart: number; platform: number };
}
export const PROFILES: Record<StoreId, StoreProfile> = {
  instamart: { bias: 1.01, produceBias: 0.98, oos: 0.07, eta: [12, 16], fee: { freeAbove: 199, delivery: 30, handling: 9, smallCartBelow: 99, smallCart: 20, platform: 0 } },
  blinkit: { bias: 1.03, produceBias: 1.0, oos: 0.06, eta: [9, 12], fee: { freeAbove: 199, delivery: 30, handling: 11, smallCartBelow: 99, smallCart: 20, platform: 0 } },
  zepto: { bias: 1.0, produceBias: 1.02, oos: 0.08, eta: [8, 11], fee: { freeAbove: 199, delivery: 30, handling: 0, smallCartBelow: 99, smallCart: 25, platform: 9 } },
  bigbasket: { bias: 0.95, produceBias: 0.94, oos: 0.05, eta: 'slotEvening', fee: { freeAbove: 600, delivery: 40, handling: 0, smallCartBelow: 0, smallCart: 0, platform: 0 } },
  amazonfresh: { bias: 0.96, produceBias: 1.05, oos: 0.09, eta: 'slot2h', fee: { freeAbove: 499, delivery: 49, handling: 0, smallCartBelow: 0, smallCart: 0, platform: 0 } },
};

const r9 = (n: number) => Math.max(5, Math.round(n) - (Math.round(n) % 10 === 0 ? 1 : 0));
const sizeLabel = (size: number, unit: Sku['unit']) =>
  unit === 'g' ? (size >= 1000 ? `${size / 1000} kg` : `${size} g`) : unit === 'ml' ? (size >= 1000 ? `${size / 1000} L` : `${size} ml`) : size === 1 ? '1 pack' : `${size} pcs`;

/** IST wall clock helpers for slot labels */
const istParts = (d: Date) => {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  return { h: Number(f.find((x) => x.type === 'hour')!.value), m: Number(f.find((x) => x.type === 'minute')!.value) };
};
const hr = (h: number) => `${((h + 11) % 12) + 1}${h < 12 || h === 24 ? ' AM' : ' PM'}`;

export class MockStoreProvider implements GroceryProvider {
  id: string;
  label: string;
  kind = 'mock' as const;
  setupHint = 'Mock provider: sample prices, stock and fees for demos.';
  private skus = new Map<string, Sku>();
  constructor(
    readonly store: StoreId,
    private latencyMs = 300,
  ) {
    this.id = `mock:${store}`;
    this.label = `${STORES[store].name} (sample data)`;
    this.buildCatalogue();
  }
  configured() {
    return true;
  }

  private buildCatalogue() {
    const prof = PROFILES[this.store];
    for (const it of ITEMS) {
      it.packs.forEach((p, idx) => {
        const r = rng(`${this.store}:${it.key}:${p.name}:${p.size}`);
        // "bb …" brands are BigBasket private labels
        if (/^bb /i.test(p.brand) && this.store !== 'bigbasket') return;
        // not every store lists every pack
        if (idx > 0 && r() < 0.12) return;
        const bias = it.category === 'produce' ? prof.produceBias : prof.bias;
        const price = r9(p.price * bias * (0.95 + r() * 0.1));
        const sku: Sku = {
          id: `${this.store}:${it.key}:${idx}`,
          store: this.store,
          itemKey: it.key,
          name: p.name,
          brand: p.brand,
          size: p.size,
          unit: it.unit,
          sizeLabel: sizeLabel(p.size, it.unit),
          price,
          mrp: Math.max(price, p.mrp ?? Math.round(price * (1 + r() * 0.12))),
          inStock: r() > prof.oos,
          emoji: it.emoji,
          sample: true,
        };
        this.skus.set(sku.id, sku);
      });
    }
  }

  async serviceability(_pincode: string, now = new Date()): Promise<Serviceability> {
    const prof = PROFILES[this.store];
    if (Array.isArray(prof.eta)) {
      const r = rng(`${this.store}:${now.getUTCHours()}`);
      const eta = Math.round(prof.eta[0] + r() * (prof.eta[1] - prof.eta[0]));
      return { serviceable: true, etaMin: eta, etaLabel: `${eta} min` };
    }
    const { h, m } = istParts(now);
    const nowMin = h * 60 + m;
    if (prof.eta === 'slot2h') {
      // next 2-hour slot starting at least 90 min from now (8 AM – 10 PM)
      let start = Math.ceil((nowMin + 90) / 120) * 120;
      if (start < 8 * 60) start = 8 * 60;
      const tomorrow = start > 20 * 60;
      if (tomorrow) start = 8 * 60;
      const mins = tomorrow ? 24 * 60 - nowMin + start : start - nowMin;
      return { serviceable: true, etaMin: mins, etaLabel: `${tomorrow ? 'Tomorrow' : 'Today'} ${hr(start / 60)}–${hr(start / 60 + 2)}` };
    }
    // BigBasket scheduled: evening slot today (6–8 PM) if before 2 PM, else tomorrow 7–9 AM
    if (nowMin < 14 * 60) return { serviceable: true, etaMin: 18 * 60 - nowMin, etaLabel: 'Today 6 PM–8 PM' };
    return { serviceable: true, etaMin: 24 * 60 - nowMin + 7 * 60, etaLabel: 'Tomorrow 7 AM–9 AM' };
  }

  async findSkus(items: ParsedItem[], ctx: { signal?: AbortSignal } = {}): Promise<Sku[]> {
    await new Promise((r) => setTimeout(r, this.latencyMs * (0.6 + rng(this.store)() * 0.8)));
    if (ctx.signal?.aborted) throw new Error('aborted');
    const keys = new Set<string>();
    for (const i of items) {
      keys.add(i.key);
      for (const s of itemByKey.get(i.key)?.subs ?? []) keys.add(s);
    }
    return [...this.skus.values()].filter((s) => keys.has(s.itemKey));
  }

  fees(subtotal: number): Fees {
    const f = PROFILES[this.store].fee;
    return {
      delivery: subtotal >= f.freeAbove ? 0 : f.delivery,
      handling: f.handling,
      smallCart: subtotal < f.smallCartBelow ? f.smallCart : 0,
      platform: f.platform,
    };
  }

  getSku(id: string) {
    return this.skus.get(id);
  }

  async fillCart(lines: CartLineInput[], ctx: { onProgress?: (p: FillProgress) => void; signal?: AbortSignal } = {}): Promise<FillResult> {
    const step = (ms: number) => new Promise((r) => setTimeout(r, ms));
    ctx.onProgress?.({ store: this.store, step: 'opening', message: `Opening ${STORES[this.store].name} (simulated)` });
    await step(this.latencyMs);
    let added = 0;
    const failed: FillResult['failed'] = [];
    for (const [i, l] of lines.entries()) {
      if (ctx.signal?.aborted) throw new Error('aborted');
      ctx.onProgress?.({ store: this.store, step: 'adding', name: `${l.packs} × ${l.name}`, i: i + 1, n: lines.length });
      await step(this.latencyMs * 0.6);
      const sku = this.skus.get(l.skuId);
      if (!sku?.inStock) {
        failed.push({ skuId: l.skuId, reason: 'went out of stock' });
        ctx.onProgress?.({ store: this.store, step: 'failed', name: l.name, i: i + 1, n: lines.length });
        continue;
      }
      added++;
      ctx.onProgress?.({ store: this.store, step: 'added', name: `${l.packs} × ${l.name}`, i: i + 1, n: lines.length });
    }
    ctx.onProgress?.({ store: this.store, step: 'verifying', message: 'Reading the cart total back' });
    await step(this.latencyMs * 0.5);
    const subtotal = lines.reduce((s, l) => s + (this.skus.get(l.skuId)?.price ?? 0) * l.packs, 0);
    const f = this.fees(subtotal);
    ctx.onProgress?.({ store: this.store, step: 'ready' });
    return { added, failed, verifiedTotal: subtotal + f.delivery + f.handling + f.smallCart + f.platform, appUrl: STORES[this.store].app, webUrl: STORES[this.store].web };
  }
}
