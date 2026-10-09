/**
 * Basket optimizer.
 *  1. packCombo: cheapest combination of pack sizes covering the wanted quantity
 *     (e.g. 2 kg atta → 2 × 1 kg vs 1 × 5 kg; one or two SKUs).
 *  2. quoteStore: per store, pick packs for every item, honouring brand / variant; otherwise
 *     substitute (other brand, then a related item) and record why; add the store's fees.
 *  3. buildPlans: Cheapest single store · Fastest single store · Cheapest split (2–3 stores, fees
 *     included, local-search re-assignment) · Best overall (price + time + hassle).
 *  4. Budget: flag plans over budget and suggest the cheapest swaps that get under it.
 */
import { createHash } from 'node:crypto';
import { itemByKey } from '../providers/catalog.js';
import { STORES, type Fees, type Line, type ParsedItem, type Plan, type PlanPart, type Sku, type StoreId, type StoreQuote } from '../types.js';

export interface Combo {
  parts: { sku: Sku; packs: number }[];
  price: number;
  covered: number;
}

/** Cheapest way to cover `qty` with at most two distinct SKUs. Ties → less overshoot. */
export function packCombo(skus: Sku[], qty: number): Combo | null {
  const s = skus.filter((x) => x.inStock && x.size > 0);
  let best: Combo | null = null;
  const consider = (c: Combo) => {
    if (c.covered < qty) return;
    // allow overshoot but penalise heavy waste slightly so 6 eggs doesn't become 30
    const waste = (c.covered - qty) / qty;
    const key = c.price * (1 + Math.max(0, waste - 0.5) * 0.15);
    const bkey = best ? best.price * (1 + Math.max(0, (best.covered - qty) / qty - 0.5) * 0.15) : Infinity;
    if (key < bkey - 0.01 || (Math.abs(key - bkey) <= 0.01 && best && c.covered < best.covered)) best = c;
  };
  for (const a of s) {
    const n = Math.max(1, Math.ceil(qty / a.size));
    consider({ parts: [{ sku: a, packs: n }], price: n * a.price, covered: n * a.size });
    for (const b of s) {
      if (b.id === a.id || b.size >= a.size) continue; // a = larger pack, b = smaller filler
      for (let na = 1; na * a.size < qty; na++) {
        const nb = Math.ceil((qty - na * a.size) / b.size);
        consider({ parts: [{ sku: a, packs: na }, { sku: b, packs: nb }], price: na * a.price + nb * b.price, covered: na * a.size + nb * b.size });
      }
    }
  }
  return best;
}

const preferred = (item: ParsedItem, s: Sku) =>
  (!item.brand || s.brand.toLowerCase() === item.brand.toLowerCase()) && (!item.variant || new RegExp(item.variant, 'i').test(s.name));

export function feeTotal(f: Fees) {
  return f.delivery + f.handling + f.smallCart + f.platform;
}

export interface StoreInput {
  store: StoreId;
  serviceable: boolean;
  etaMin: number;
  etaLabel: string;
  skus: Sku[];
  fees: (subtotal: number) => Fees;
  sample: boolean;
}

/** Lines for one item at one store (may be 2 lines when two pack sizes are combined). */
export function linesFor(item: ParsedItem, skus: Sku[], store: StoreId): Line[] | null {
  const own = skus.filter((s) => s.itemKey === item.key);
  const pref = own.filter((s) => preferred(item, s));
  let combo = packCombo(pref, item.qty);
  let substitution: Line['substitution'];
  const want = [item.brand, item.variant?.split('|')[0]].filter(Boolean).join(' ');
  if (!combo && (item.brand || item.variant)) {
    combo = packCombo(own, item.qty);
    if (combo) substitution = { reason: `${want} ${item.name.toLowerCase()} not available at ${STORES[store].short}; picked ${combo.parts[0].sku.brand}`, wanted: want };
  }
  if (!combo) {
    for (const subKey of itemByKey.get(item.key)?.subs ?? []) {
      combo = packCombo(skus.filter((s) => s.itemKey === subKey), item.qty);
      if (combo) {
        substitution = { reason: `${item.name} out of stock; ${itemByKey.get(subKey)?.name ?? subKey} instead`, wanted: item.name };
        break;
      }
    }
  }
  if (!combo) return null;
  // alternatives: other single-SKU options for the same item, cheapest first
  const chosen = new Set(combo.parts.map((p) => p.sku.id));
  const alternatives = own
    .filter((s) => s.inStock && !chosen.has(s.id))
    .map((s) => {
      const packs = Math.max(1, Math.ceil(item.qty / s.size));
      return { sku: s, packs, price: packs * s.price };
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, 4);
  return combo.parts.map((p, i) => ({
    itemId: item.id,
    store,
    sku: p.sku,
    packs: p.packs,
    covered: p.packs * p.sku.size,
    price: p.packs * p.sku.price,
    substitution: i === 0 ? substitution : undefined,
    alternatives: i === 0 ? alternatives : [],
  }));
}

export function quoteStore(items: ParsedItem[], s: StoreInput): StoreQuote {
  const lines: Line[] = [];
  const missing: string[] = [];
  for (const it of items) {
    const ls = s.serviceable ? linesFor(it, s.skus, s.store) : null;
    if (ls) lines.push(...ls);
    else missing.push(it.id);
  }
  const subtotal = lines.reduce((a, l) => a + l.price, 0);
  const fees = s.fees(subtotal);
  return {
    store: s.store,
    storeName: STORES[s.store].name,
    serviceable: s.serviceable,
    etaMin: s.etaMin,
    etaLabel: s.etaLabel,
    lines,
    missing,
    subtotal,
    fees,
    total: subtotal + feeTotal(fees),
    sample: s.sample,
  };
}

function part(store: StoreId, lines: Line[], inputs: Map<StoreId, StoreInput>): PlanPart {
  const inp = inputs.get(store)!;
  const subtotal = lines.reduce((a, l) => a + l.price, 0);
  const fees = inp.fees(subtotal);
  return { store, storeName: STORES[store].name, lines, subtotal, fees, total: subtotal + feeTotal(fees), etaMin: inp.etaMin, etaLabel: inp.etaLabel };
}

function makePlan(strategy: Plan['strategy'], label: string, parts: PlanPart[], items: ParsedItem[], why: string, budget?: number): Plan {
  parts = parts.filter((p) => p.lines.length);
  const covered = new Set(parts.flatMap((p) => p.lines.map((l) => l.itemId)));
  const total = parts.reduce((a, p) => a + p.total, 0);
  const slowest = parts.reduce((a, p) => (p.etaMin > a.etaMin ? p : a), parts[0]);
  const id = createHash('sha1')
    .update(strategy + parts.map((p) => p.store + p.lines.map((l) => l.sku.id + 'x' + l.packs).join()).join('|'))
    .digest('hex')
    .slice(0, 10);
  return {
    id,
    strategy,
    label,
    parts,
    total,
    fees: parts.reduce((a, p) => a + feeTotal(p.fees), 0),
    etaMin: slowest?.etaMin ?? 0,
    etaLabel: parts.length > 1 ? `${parts.map((p) => p.etaLabel).join(' + ')}` : (slowest?.etaLabel ?? ''),
    missing: items.filter((i) => !covered.has(i.id)).map((i) => i.id),
    substitutions: parts.reduce((a, p) => a + p.lines.filter((l) => l.substitution).length, 0),
    savingsVsMax: 0,
    overBudget: !!budget && total > budget,
    why,
  };
}

const subsets = <T,>(arr: T[], k: number): T[][] => (k === 0 ? [[]] : arr.flatMap((x, i) => subsets(arr.slice(i + 1), k - 1).map((s) => [x, ...s])));

/** Score for "best overall": rupees + time value + extra-delivery hassle + gaps. */
export const overallScore = (p: Plan) => p.total + Math.min(p.etaMin, 600) * 0.35 + (p.parts.length - 1) * 25 + p.missing.length * 120 + p.substitutions * 12;

export function buildPlans(items: ParsedItem[], quotes: StoreQuote[], inputs: StoreInput[], opts: { budget?: number; maxSplit?: number } = {}) {
  const inMap = new Map(inputs.map((i) => [i.store, i]));
  const ok = quotes.filter((q) => q.serviceable);
  const byCompleteness = (a: StoreQuote, b: StoreQuote) => a.missing.length - b.missing.length;
  const singles = ok.map((q) => makePlan('cheapest', q.storeName, [part(q.store, q.lines, inMap)], items, '', opts.budget));
  const plans: Plan[] = [];

  const cheapestQ = [...ok].sort((a, b) => byCompleteness(a, b) || a.total - b.total)[0];
  if (cheapestQ) {
    plans.push(makePlan('cheapest', 'Cheapest single store', [part(cheapestQ.store, cheapestQ.lines, inMap)], items, `Lowest total at one store, including ₹${feeTotal(cheapestQ.fees)} fees.`, opts.budget));
  }
  const fastestQ = [...ok].sort((a, b) => byCompleteness(a, b) || a.etaMin - b.etaMin || a.total - b.total)[0];
  if (fastestQ) {
    plans.push(makePlan('fastest', 'Fastest delivery', [part(fastestQ.store, fastestQ.lines, inMap)], items, `Arrives in ${fastestQ.etaLabel} with everything on the list.`, opts.budget));
  }

  // split: per subset, assign each item to the cheapest store that has it, then improve with fees
  let bestSplit: Plan | null = null;
  const stores = ok.map((q) => q.store);
  for (let k = 2; k <= Math.min(opts.maxSplit ?? 3, stores.length); k++) {
    for (const sub of subsets(stores, k)) {
      const options = new Map<string, Map<StoreId, Line[]>>();
      for (const it of items) {
        const m = new Map<StoreId, Line[]>();
        for (const st of sub) {
          const ls = quotes.find((q) => q.store === st)!.lines.filter((l) => l.itemId === it.id);
          if (ls.length) m.set(st, ls);
        }
        options.set(it.id, m);
      }
      const assign = new Map<string, StoreId>();
      for (const it of items) {
        const m = options.get(it.id)!;
        let bestSt: StoreId | null = null;
        for (const [st, ls] of m) if (!bestSt || ls.reduce((a, l) => a + l.price, 0) < m.get(bestSt)!.reduce((a, l) => a + l.price, 0)) bestSt = st;
        if (bestSt) assign.set(it.id, bestSt);
      }
      const build = () =>
        sub.map((st) =>
          part(
            st,
            items.filter((it) => assign.get(it.id) === st).flatMap((it) => options.get(it.id)!.get(st)!),
            inMap,
          ),
        );
      const total = () => build().filter((p) => p.lines.length).reduce((a, p) => a + p.total, 0);
      // local search: move single items between stores while it lowers the total (fees are non-linear)
      for (let pass = 0; pass < 3; pass++) {
        let improved = false;
        for (const it of items) {
          const cur = assign.get(it.id);
          if (!cur) continue;
          for (const st of options.get(it.id)!.keys()) {
            if (st === cur) continue;
            const before = total();
            assign.set(it.id, st);
            if (total() < before - 0.5) improved = true;
            else assign.set(it.id, cur);
          }
        }
        if (!improved) break;
      }
      const parts = build().filter((p) => p.lines.length);
      if (parts.length < 2) continue;
      const plan = makePlan('split', `Split: ${parts.map((p) => STORES[p.store].short).join(' + ')}`, parts, items, '', opts.budget);
      if (!bestSplit || plan.missing.length < bestSplit.missing.length || (plan.missing.length === bestSplit.missing.length && plan.total < bestSplit.total)) bestSplit = plan;
    }
  }
  const cheapestPlan = plans[0];
  let splitNote = '';
  if (bestSplit && cheapestPlan && (bestSplit.missing.length < cheapestPlan.missing.length || bestSplit.total <= cheapestPlan.total - 20)) {
    const save = cheapestPlan.total - bestSplit.total;
    bestSplit.why =
      bestSplit.missing.length < cheapestPlan.missing.length
        ? 'Covers items no single store has.'
        : `Saves ₹${save} vs the cheapest single store, even after paying ${bestSplit.parts.length} sets of fees.`;
    plans.push(bestSplit);
  } else if (bestSplit && cheapestPlan) {
    splitNote = `Splitting would save only ₹${Math.max(0, cheapestPlan.total - bestSplit.total)} after extra fees, so one store is better.`;
  }

  // best overall across singles + chosen plans
  const pool = [...singles, ...plans];
  const bestAll = pool.sort((a, b) => overallScore(a) - overallScore(b))[0];
  if (bestAll) {
    const bal = { ...bestAll, strategy: 'balanced' as const, label: 'Best overall', id: bestAll.id + 'b' };
    bal.why = `Best mix of price (₹${bal.total}), speed (${bal.etaLabel}) and convenience${bal.substitutions ? `, ${bal.substitutions} substitution${bal.substitutions > 1 ? 's' : ''}` : ''}.`;
    plans.unshift(bal);
  }
  const maxTotal = Math.max(0, ...ok.filter((q) => !q.missing.length).map((q) => q.total));
  for (const p of plans) p.savingsVsMax = Math.max(0, maxTotal - p.total);
  return { plans, recommended: plans[0]?.id, splitNote };
}

/** Cheapest swaps (alternatives) in a plan, best savings first. */
export function budgetTips(plan: Plan, items: ParsedItem[], budget?: number) {
  if (!budget || plan.total <= budget) return [];
  const tips: { itemId: string; store: StoreId; from: string; to: string; skuId: string; packs: number; save: number }[] = [];
  for (const p of plan.parts)
    for (const l of p.lines) {
      const alt = l.alternatives.find((a) => a.price < l.price);
      if (alt) tips.push({ itemId: l.itemId, store: p.store, from: `${l.packs} × ${l.sku.name}`, to: `${alt.packs} × ${alt.sku.name}`, skuId: alt.sku.id, packs: alt.packs, save: l.price - alt.price });
    }
  tips.sort((a, b) => b.save - a.save);
  const out: typeof tips = [];
  let gap = plan.total - budget;
  for (const t of tips) {
    if (gap <= 0) break;
    out.push(t);
    gap -= t.save;
  }
  void items;
  return out;
}
