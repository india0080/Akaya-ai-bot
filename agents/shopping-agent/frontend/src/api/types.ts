/** Mirrors backend zod schemas (see backend/src/types.ts and docs/API.md). */
export type StoreId =
  'amazon' | 'flipkart' | 'myntra' | 'meesho' | 'croma' | 'ajio' | 'reliance-digital' | 'tatacliq' | 'nykaa' | 'other';
export type Preset = 'balanced' | 'cheapest' | 'fastest' | 'quality';
export type SortBy = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'delivery' | 'discount';
export type Badge = 'best_price' | 'best_rated' | 'best_value' | 'fastest';

export interface Filters {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDeliveryDays?: number;
  stores?: StoreId[];
  hideHighFakeRisk?: boolean;
  inStockOnly?: boolean;
}
export interface ParsedQuery {
  raw: string;
  q: string;
  filters: Filters;
  hints: string[];
  lang: 'en' | 'hi' | 'hinglish';
}
export interface FakeRisk {
  score: number;
  level: 'low' | 'medium' | 'high';
  signals: string[];
}
export interface Offer {
  id: string;
  productKey: string;
  store: StoreId;
  storeName: string;
  title: string;
  brand: string;
  category: string;
  emoji?: string;
  price: number;
  mrp: number;
  rating: number;
  ratingCount: number;
  reviewCount: number;
  histogram?: number[];
  verifiedShare?: number;
  recentShare?: number;
  seller: { name: string; rating?: number; years?: number; fulfilled?: boolean };
  delivery: { days: number; free: boolean; cod?: boolean };
  inStock: boolean;
  url: string;
  specs: Record<string, string>;
  source: string;
  sample: boolean;
}
export interface RankedOffer extends Offer {
  score: number;
  breakdown: { price: number; rating: number; reviews: number; trust: number; delivery: number; fakePenalty: number };
  fakeRisk: FakeRisk;
  discountPct: number;
  affiliateUrl: string;
}
export interface Product {
  key: string;
  title: string;
  brand: string;
  category: string;
  emoji?: string;
  rank: number;
  score: number;
  badges: Badge[];
  best: RankedOffer;
  offers: RankedOffer[];
  priceRange: [number, number];
  sample: boolean;
}
export interface SearchProgress {
  provider: string;
  store: string;
  status: 'searching' | 'done' | 'error';
  count?: number;
  message?: string;
}
export interface SearchResult {
  query: string;
  parsed: ParsedQuery;
  preset: Preset;
  sort: SortBy;
  products: Product[];
  totalOffers: number;
  stores: string[];
  providers: { id: string; label: string; kind: string; count: number; error?: string }[];
  cached: boolean;
  tookMs: number;
  sample: boolean;
}
export interface Job<R> {
  id: string;
  type: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: SearchProgress[];
  result?: R;
  error?: string;
}
export interface History {
  key: string;
  days: number;
  series: { store: StoreId; storeName: string; points: { date: string; price: number }[] }[];
  stats: { current: number; low: number; high: number; avg: number };
  verdict: 'great' | 'good' | 'wait';
  verdictText: string;
  sample: boolean;
}
export interface Compare {
  products: Product[];
  rows: { label: string; values: (string | number)[]; best: number | null }[];
  winner: string;
  sample: boolean;
}
export interface WatchItem {
  id: string;
  productKey: string;
  offerId: string;
  title: string;
  store: StoreId;
  storeName: string;
  emoji?: string;
  url: string;
  priceAtAdd: number;
  currentPrice: number;
  lowestSeen: number;
  targetPrice?: number;
  anyDrop: boolean;
  history: { t: number; price: number }[];
  createdAt: number;
  lastChecked: number;
  sample: boolean;
}
export interface AppNotification {
  id: string;
  kind: string;
  title: string;
  body: string;
  link?: string;
  createdAt: number;
  read: boolean;
  channels: { channel: string; status: string }[];
}
export interface ProviderInfo {
  id: string;
  label: string;
  kind: string;
  stores: string[];
  requested: boolean;
  configured: boolean;
  active: boolean;
  sampleData: boolean;
  setupHint: string;
}
