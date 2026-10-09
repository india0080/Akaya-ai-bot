/**
 * Watchlist + price alerts. A periodic checker refreshes prices through the offer's provider and
 * notifies the user (SSE + push stubs) when the price reaches the target or drops by ≥ 5%.
 */
import { randomUUID } from 'node:crypto';
import type { JsonDb } from './db.js';
import type { NotificationService } from './notifications.js';
import type { SearchService } from './search.js';

export interface WatchItem {
  id: string;
  userId: string;
  productKey: string;
  offerId: string;
  title: string;
  store: string;
  storeName: string;
  emoji?: string;
  url: string;
  priceAtAdd: number;
  currentPrice: number;
  lowestSeen: number;
  targetPrice?: number;
  /** alert on any drop ≥ 5% even without a target */
  anyDrop: boolean;
  history: { t: number; price: number }[];
  createdAt: number;
  lastChecked: number;
  lastAlertPrice?: number;
  sample: boolean;
}
export interface WatchState {
  watchlist: WatchItem[];
}

export class WatchlistService {
  private timer: NodeJS.Timeout | null = null;
  constructor(
    private db: JsonDb<WatchState & object>,
    private search: SearchService,
    private notify: NotificationService,
  ) {}

  list(userId: string) {
    return this.db.data.watchlist.filter((w) => w.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  }

  add(userId: string, input: { offerId?: string; productKey?: string; targetPrice?: number; anyDrop?: boolean }) {
    let offer = input.offerId ? this.search.getOffer(input.offerId) : undefined;
    if (!offer && input.productKey) offer = this.search.getProduct(input.productKey)?.best;
    if (!offer) return null;
    const existing = this.db.data.watchlist.find((w) => w.userId === userId && w.offerId === offer.id);
    if (existing) {
      existing.targetPrice = input.targetPrice ?? existing.targetPrice;
      existing.anyDrop = input.anyDrop ?? existing.anyDrop;
      this.db.save();
      return existing;
    }
    const w: WatchItem = {
      id: randomUUID(),
      userId,
      productKey: offer.productKey,
      offerId: offer.id,
      title: offer.title,
      store: offer.store,
      storeName: offer.storeName,
      emoji: offer.emoji,
      url: this.search.link(offer),
      priceAtAdd: offer.price,
      currentPrice: offer.price,
      lowestSeen: offer.price,
      targetPrice: input.targetPrice,
      anyDrop: input.anyDrop ?? true,
      history: [{ t: Date.now(), price: offer.price }],
      createdAt: Date.now(),
      lastChecked: Date.now(),
      sample: offer.sample,
    };
    this.db.data.watchlist.push(w);
    this.db.save();
    return w;
  }

  update(userId: string, id: string, patch: { targetPrice?: number | null; anyDrop?: boolean }) {
    const w = this.db.data.watchlist.find((x) => x.userId === userId && x.id === id);
    if (!w) return null;
    if (patch.targetPrice !== undefined) w.targetPrice = patch.targetPrice ?? undefined;
    if (patch.anyDrop !== undefined) w.anyDrop = patch.anyDrop;
    this.db.save();
    return w;
  }

  remove(userId: string, id: string) {
    const before = this.db.data.watchlist.length;
    this.db.data.watchlist = this.db.data.watchlist.filter((w) => !(w.userId === userId && w.id === id));
    this.db.save();
    return before !== this.db.data.watchlist.length;
  }

  /** Re-check prices; returns the alerts that fired. */
  async checkPrices(userId?: string) {
    const fired: { item: WatchItem; reason: string }[] = [];
    for (const w of this.db.data.watchlist) {
      if (userId && w.userId !== userId) continue;
      const offer = this.search.getOffer(w.offerId) ?? this.search.getProduct(w.productKey)?.offers.find((o) => o.id === w.offerId);
      const provider = offer && this.search.providerFor(offer);
      if (!offer || !provider?.refreshPrice) continue;
      const price = await provider.refreshPrice({ ...offer, price: w.currentPrice }).catch(() => null);
      w.lastChecked = Date.now();
      if (!price) continue;
      if (price !== w.currentPrice) w.history.push({ t: Date.now(), price });
      w.history = w.history.slice(-60);
      const prev = w.currentPrice;
      w.currentPrice = price;
      w.lowestSeen = Math.min(w.lowestSeen, price);
      const ref = w.lastAlertPrice ?? w.priceAtAdd;
      let reason = '';
      if (w.targetPrice && price <= w.targetPrice && (w.lastAlertPrice === undefined || price < w.lastAlertPrice)) reason = `hit your target ₹${w.targetPrice.toLocaleString('en-IN')}`;
      else if (w.anyDrop && price <= ref * 0.95 && price < prev) reason = `dropped ${Math.round((1 - price / ref) * 100)}%`;
      if (reason) {
        w.lastAlertPrice = price;
        fired.push({ item: w, reason });
        this.notify.notify(w.userId, {
          kind: 'price_drop',
          title: `Price drop: ₹${price.toLocaleString('en-IN')} on ${w.storeName}`,
          body: `${w.title} ${reason}${price < prev ? ` (was ₹${prev.toLocaleString('en-IN')})` : ''}. Buy on ${w.storeName} when ready.${w.sample ? ' Sample data.' : ''}`,
          link: `#/product/${encodeURIComponent(w.productKey)}`,
          data: { watchId: w.id, price, prev },
        });
      }
    }
    this.db.save();
    return fired;
  }

  startChecker(intervalMs: number) {
    if (this.timer || intervalMs <= 0) return;
    this.timer = setInterval(() => void this.checkPrices(), intervalMs);
    this.timer.unref?.();
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
