export type StoreId = 'instamart' | 'blinkit' | 'zepto' | 'bigbasket' | 'amazonfresh';
export type Unit = 'g' | 'ml' | 'pc';
export type Strategy = 'cheapest' | 'fastest' | 'split' | 'balanced';

export interface ParsedItem {
  id: string;
  raw: string;
  key: string;
  name: string;
  emoji: string;
  qty: number;
  unit: Unit;
  display: string;
  brand?: string;
  variant?: string;
  confidence: number;
}
export interface ParseResult {
  items: ParsedItem[];
  unknown: string[];
  lang: 'en' | 'hi' | 'hinglish';
}
export interface Sku {
  id: string;
  store: StoreId;
  itemKey: string;
  name: string;
  brand: string;
  size: number;
  unit: Unit;
  sizeLabel: string;
  price: number;
  mrp: number;
  inStock: boolean;
  emoji: string;
  sample: boolean;
}
export interface Fees {
  delivery: number;
  handling: number;
  smallCart: number;
  platform: number;
}
export interface Alt {
  sku: Sku;
  packs: number;
  price: number;
}
export interface Line {
  itemId: string;
  store: StoreId;
  sku: Sku;
  packs: number;
  covered: number;
  price: number;
  substitution?: { reason: string; wanted: string };
  alternatives: Alt[];
}
export interface StoreQuote {
  store: StoreId;
  storeName: string;
  serviceable: boolean;
  etaMin: number;
  etaLabel: string;
  lines: Line[];
  missing: string[];
  subtotal: number;
  fees: Fees;
  total: number;
  sample: boolean;
}
export interface PlanPart {
  store: StoreId;
  storeName: string;
  lines: Line[];
  subtotal: number;
  fees: Fees;
  total: number;
  etaMin: number;
  etaLabel: string;
}
export interface Plan {
  id: string;
  strategy: Strategy;
  label: string;
  parts: PlanPart[];
  total: number;
  fees: number;
  etaMin: number;
  etaLabel: string;
  missing: string[];
  substitutions: number;
  savingsVsMax: number;
  overBudget: boolean;
  why: string;
}
export interface BudgetTip {
  itemId: string;
  store: StoreId;
  from: string;
  to: string;
  skuId: string;
  packs: number;
  save: number;
}
export interface Quote {
  id: string;
  text?: string;
  items: ParsedItem[];
  unknown: string[];
  lang: string;
  pincode: string;
  address: string;
  quotes: StoreQuote[];
  plans: Plan[];
  recommended?: string;
  splitNote: string;
  budget?: number;
  budgetTips: BudgetTip[];
  createdAt: number;
  sample: boolean;
}
export interface QuoteProgress {
  store: StoreId;
  status: 'checking' | 'done' | 'error';
  found?: number;
  etaLabel?: string;
  message?: string;
}
export interface FillProgress {
  store: StoreId;
  step: 'opening' | 'adding' | 'added' | 'failed' | 'verifying' | 'ready';
  name?: string;
  i?: number;
  n?: number;
  message?: string;
}
export interface Job<T, P = unknown> {
  id: string;
  type: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: P[];
  error?: string;
  result?: T;
}
export type CartStatus = 'queued' | 'filling' | 'ready' | 'partial' | 'handed_off' | 'paid_by_user' | 'cancelled' | 'expired' | 'failed';
export interface Cart {
  store: StoreId;
  storeName: string;
  lines: Line[];
  subtotal: number;
  fees: Fees;
  total: number;
  verifiedTotal?: number;
  etaLabel: string;
  status: CartStatus;
  failed: { skuId: string; reason: string }[];
  appUrl: string;
  webUrl: string;
  readyAt?: number;
  expiresAt?: number;
  handedOffAt?: number;
  orderId?: string;
}
export interface Checkout {
  id: string;
  quoteId: string;
  planId: string;
  planLabel: string;
  status: 'filling' | 'ready_to_pay' | 'completed' | 'cancelled';
  carts: Cart[];
  total: number;
  jobId: string;
  createdAt: number;
  sample: boolean;
}
export interface Handoff {
  store: StoreId;
  storeName: string;
  amount: number;
  appUrl: string;
  webUrl: string;
  steps: string[];
  note: string;
}
export interface Order {
  id: string;
  checkoutId: string;
  store: StoreId;
  storeName: string;
  items: { name: string; packs: number; sizeLabel: string; emoji: string }[];
  total: number;
  placedAt: number;
  etaMin: number;
  etaLabel: string;
  sample: boolean;
  stage: string;
  stageLabel: string;
  progress: number;
  minutesLeft: number;
  stages: { key: string; label: string; at: number; done: boolean; eta: string }[];
  simulated: boolean;
}
export interface Schedule {
  enabled: boolean;
  days: number[];
  time: string;
  strategy: Strategy;
  autoFill: boolean;
}
export interface SavedList {
  id: string;
  name: string;
  emoji: string;
  text: string;
  budget?: number;
  schedule?: Schedule;
  nextRunAt?: number;
  lastRunAt?: number;
  lastQuoteId?: string;
  createdAt: number;
  updatedAt: number;
}
export interface Settings {
  pincode: string;
  address: string;
  budget?: number;
  stores: StoreId[];
  strategy: Strategy;
}
export interface AppNotification {
  id: string;
  kind: string;
  title: string;
  body: string;
  link?: string;
  createdAt: number;
  read: boolean;
}
export interface ProviderStore {
  store: StoreId;
  name: string;
  mode: 'quick' | 'slot';
  active: { id: string; label: string; kind: 'mock' | 'playwright' | 'partner'; sampleData: boolean };
  playwright: { requested: boolean; configured: boolean; setupHint: string };
  officialMcp: { configured: boolean; setupHint: string } | null;
}
