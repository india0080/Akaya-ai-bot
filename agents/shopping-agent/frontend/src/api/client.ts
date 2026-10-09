import type { AppNotification, Compare, Filters, History, Job, Preset, Product, ProviderInfo, SearchResult, SortBy, WatchItem } from './types';

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

export interface SearchReq {
  query: string;
  filters?: Filters;
  sort?: SortBy;
  preset?: Preset;
}

export const api = {
  search: (b: SearchReq) => post<Job<SearchResult>>('/api/search', b),
  job: (id: string) => req<Job<SearchResult>>(`/api/jobs/${id}`),
  jobEvents: (id: string) => new EventSource(`${API}/api/jobs/${id}/events`),
  recent: () => req<{ q: string; at: number }[]>('/api/searches/recent'),
  product: (key: string) => req<Product>(`/api/products/${encodeURIComponent(key)}`),
  history: (key: string, days: number) => req<History>(`/api/products/${encodeURIComponent(key)}/history?days=${days}`),
  compare: (keys: string[]) => post<Compare>('/api/compare', { keys }),
  watchlist: () => req<WatchItem[]>('/api/watchlist'),
  watch: (b: { offerId?: string; productKey?: string; targetPrice?: number; anyDrop?: boolean }) => post<WatchItem>('/api/watchlist', b),
  updateWatch: (id: string, b: { targetPrice?: number | null; anyDrop?: boolean }) =>
    req<WatchItem>(`/api/watchlist/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  unwatch: (id: string) => req<void>(`/api/watchlist/${id}`, { method: 'DELETE' }),
  checkPrices: () => post<{ checked: number; alerts: { id: string; title: string; price: number; reason: string }[] }>('/api/watchlist/check', {}),
  notifications: () => req<AppNotification[]>('/api/notifications'),
  markRead: (id?: string) => post<{ ok: boolean }>('/api/notifications/read', { id }),
  testNotification: () => post<AppNotification>('/api/notifications/test', { title: 'Test alert from Akaya Shopping' }),
  subscribePush: (token: string) => post<{ ok: boolean; delivery: string }>('/api/notifications/subscribe', { kind: 'webpush', token }),
  notificationStream: () => new EventSource(`${API}/api/notifications/stream?user=${USER}`),
  providers: () => req<{ active: string[]; providers: ProviderInfo[] }>('/api/providers'),
  health: () => req<{ ok: boolean }>('/api/health'),
};
