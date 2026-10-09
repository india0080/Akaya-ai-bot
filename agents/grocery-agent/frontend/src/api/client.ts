import type { AppNotification, Checkout, Handoff, Job, Order, ParsedItem, ParseResult, ProviderStore, Quote, QuoteProgress, SavedList, Schedule, Settings, StoreId } from './types';

/** Backend origin. Empty in dev: Vite proxies /api to the backend (see vite.config.ts). */
export const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const USER = 'demo';

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(API + path, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-user-id': USER, ...(init.headers ?? {}) },
  });
  if (r.status === 204) return undefined as T;
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error ?? body.message ?? `HTTP ${r.status}`);
  return body as T;
}
const post = <T>(path: string, body: unknown) => req<T>(path, { method: 'POST', body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) => req<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

export interface Override {
  itemId: string;
  store: StoreId;
  skuId: string;
  packs: number;
}
export interface ListInput {
  name: string;
  text: string;
  emoji?: string;
  budget?: number;
  schedule?: Schedule;
}

export const api = {
  parse: (text: string) => post<ParseResult>('/api/parse', { text }),
  quote: (b: { text?: string; items?: ParsedItem[]; budget?: number }) => post<Job<Quote, QuoteProgress>>('/api/quotes', b),
  getQuote: (id: string) => req<Quote>(`/api/quotes/${id}`),
  job: <T, P = unknown>(id: string) => req<Job<T, P>>(`/api/jobs/${id}`),
  jobEvents: (id: string) => new EventSource(`${API}/api/jobs/${id}/events`),
  createCheckout: (b: { quoteId: string; planId: string; overrides?: Override[]; removed?: string[] }) => post<Checkout>('/api/checkouts', b),
  checkouts: () => req<Checkout[]>('/api/checkouts'),
  checkout: (id: string) => req<Checkout>(`/api/checkouts/${id}`),
  handoff: (id: string, store: StoreId) => post<Handoff>(`/api/checkouts/${id}/carts/${store}/handoff`, {}),
  paid: (id: string, store: StoreId) => post<Order>(`/api/checkouts/${id}/carts/${store}/paid`, { userConfirmed: true }),
  cancel: (id: string, store?: StoreId) => post<Checkout>(`/api/checkouts/${id}/cancel`, { store }),
  orders: () => req<Order[]>('/api/orders'),
  order: (id: string) => req<Order>(`/api/orders/${id}`),
  lists: () => req<SavedList[]>('/api/lists'),
  createList: (b: ListInput) => post<SavedList>('/api/lists', b),
  updateList: (id: string, b: Partial<ListInput>) => patch<SavedList>(`/api/lists/${id}`, b),
  deleteList: (id: string) => req<void>(`/api/lists/${id}`, { method: 'DELETE' }),
  runList: (id: string, autoFill?: boolean) => post<{ quoteId: string; checkoutId?: string; plans: number }>(`/api/lists/${id}/run`, { autoFill }),
  settings: () => req<Settings>('/api/settings'),
  updateSettings: (b: Partial<Omit<Settings, 'budget'>> & { budget?: number | null }) => patch<Settings>('/api/settings', b),
  notifications: () => req<AppNotification[]>('/api/notifications'),
  markRead: (id?: string) => post<{ ok: boolean }>('/api/notifications/read', { id }),
  testNotification: () => post<AppNotification>('/api/notifications/test', {}),
  subscribePush: (token: string) => post<{ ok: boolean; delivery: string }>('/api/notifications/subscribe', { kind: 'webpush', token }),
  notificationStream: () => new EventSource(`${API}/api/notifications/stream?user=${USER}`),
  providers: () => req<{ stores: ProviderStore[]; note: string }>('/api/providers'),
};
