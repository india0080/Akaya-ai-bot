import { z } from 'zod';

export const StoreId = z.enum(['instamart', 'blinkit', 'zepto', 'bigbasket', 'amazonfresh']);
export type StoreId = z.infer<typeof StoreId>;

export const STORES: Record<StoreId, { name: string; short: string; color: string; mono: string; mode: 'quick' | 'slot'; app: string; web: string }> = {
  instamart: { name: 'Swiggy Instamart', short: 'Instamart', color: '#fc8019', mono: 'IM', mode: 'quick', app: 'swiggy://instamart/cart', web: 'https://www.swiggy.com/instamart' },
  blinkit: { name: 'Blinkit', short: 'Blinkit', color: '#f8cb46', mono: 'b', mode: 'quick', app: 'blinkit://cart', web: 'https://blinkit.com' },
  zepto: { name: 'Zepto', short: 'Zepto', color: '#5b1fa3', mono: 'Z', mode: 'quick', app: 'zepto://cart', web: 'https://www.zeptonow.com' },
  bigbasket: { name: 'BigBasket', short: 'BigBasket', color: '#84c225', mono: 'bb', mode: 'slot', app: 'bigbasket://basket', web: 'https://www.bigbasket.com/basket/' },
  amazonfresh: { name: 'Amazon Fresh', short: 'Amazon Fresh', color: '#3a9e3a', mono: 'af', mode: 'slot', app: 'amazon://fresh/cart', web: 'https://www.amazon.in/alm/storefront?almBrandId=ctnow' },
};

/** base units: grams, millilitres, pieces */
export const Unit = z.enum(['g', 'ml', 'pc']);
export type Unit = z.infer<typeof Unit>;

export const ParsedItem = z.object({
  id: z.string(),
  raw: z.string(),
  key: z.string().describe('catalogue item key, e.g. "atta"'),
  name: z.string(),
  emoji: z.string(),
  qty: z.number().describe('in base units (g / ml / pc)'),
  unit: Unit,
  display: z.string().describe('human quantity, e.g. "2 kg"'),
  brand: z.string().optional(),
  variant: z.string().optional().describe('pack-name preference, e.g. "Mustard"'),
  confidence: z.number(),
});
export type ParsedItem = z.infer<typeof ParsedItem>;

export const Sku = z.object({
  id: z.string(),
  store: StoreId,
  itemKey: z.string(),
  name: z.string(),
  brand: z.string(),
  size: z.number(),
  unit: Unit,
  sizeLabel: z.string(),
  price: z.number(),
  mrp: z.number(),
  inStock: z.boolean(),
  emoji: z.string(),
  sample: z.boolean(),
});
export type Sku = z.infer<typeof Sku>;

export const Fees = z.object({ delivery: z.number(), handling: z.number(), smallCart: z.number(), platform: z.number() });
export type Fees = z.infer<typeof Fees>;

export const Line = z.object({
  itemId: z.string(),
  store: StoreId,
  sku: Sku,
  packs: z.number().int().positive(),
  covered: z.number(),
  price: z.number(),
  substitution: z.object({ reason: z.string(), wanted: z.string() }).optional(),
  alternatives: z.array(z.object({ sku: Sku, packs: z.number(), price: z.number() })).default([]),
});
export type Line = z.infer<typeof Line>;

export const StoreQuote = z.object({
  store: StoreId,
  storeName: z.string(),
  serviceable: z.boolean(),
  etaMin: z.number(),
  etaLabel: z.string(),
  lines: z.array(Line),
  missing: z.array(z.string()).describe('item ids not available'),
  subtotal: z.number(),
  fees: Fees,
  total: z.number(),
  sample: z.boolean(),
});
export type StoreQuote = z.infer<typeof StoreQuote>;

export const Strategy = z.enum(['cheapest', 'fastest', 'split', 'balanced']);
export type Strategy = z.infer<typeof Strategy>;

export const PlanPart = z.object({ store: StoreId, storeName: z.string(), lines: z.array(Line), subtotal: z.number(), fees: Fees, total: z.number(), etaMin: z.number(), etaLabel: z.string() });
export type PlanPart = z.infer<typeof PlanPart>;
export const Plan = z.object({
  id: z.string(),
  strategy: Strategy,
  label: z.string(),
  parts: z.array(PlanPart),
  total: z.number(),
  fees: z.number(),
  etaMin: z.number(),
  etaLabel: z.string(),
  missing: z.array(z.string()),
  substitutions: z.number(),
  savingsVsMax: z.number(),
  overBudget: z.boolean(),
  why: z.string(),
});
export type Plan = z.infer<typeof Plan>;
