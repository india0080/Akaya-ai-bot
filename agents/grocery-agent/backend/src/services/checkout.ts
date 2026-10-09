/**
 * Checkout = the user's chosen plan turned into one cart per store.
 *   filling → ready (notify "ready to pay") → handed_off (user opened the store app) → paid_by_user
 * Akaya NEVER pays. "paid_by_user" is recorded only when the user confirms they paid in the store
 * app (a partner API / order webhook would confirm this in production).
 */
import { randomUUID } from 'node:crypto';
import type { Config } from '../config.js';
import { feeTotal } from '../engine/optimizer.js';
import { itemByKey } from '../providers/catalog.js';
import type { FillProgress } from '../providers/types.js';
import { STORES, type Fees, type Line, type StoreId } from '../types.js';
import type { JsonDb } from './db.js';
import type { NotificationService } from './notifications.js';
import type { JobQueue } from './queue.js';
import type { QuoteService } from './quotes.js';

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
  userId: string;
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
export interface Order {
  id: string;
  userId: string;
  checkoutId: string;
  store: StoreId;
  storeName: string;
  items: { name: string; packs: number; sizeLabel: string; emoji: string }[];
  total: number;
  placedAt: number;
  etaMin: number;
  etaLabel: string;
  lastStage?: string;
  sample: boolean;
}
export interface CheckoutState {
  checkouts: Checkout[];
  orders: Order[];
}
export interface Override {
  itemId: string;
  store: StoreId;
  skuId: string;
  packs: number;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    msg: string,
  ) {
    super(msg);
  }
}

export class CheckoutService {
  constructor(
    private cfg: Config,
    private db: JsonDb<CheckoutState & object>,
    private quotes: QuoteService,
    private queue: JobQueue,
    private notify: NotificationService,
  ) {}

  private view(c: Checkout): Checkout {
    const now = Date.now();
    for (const cart of c.carts) if ((cart.status === 'ready' || cart.status === 'partial') && cart.expiresAt && now > cart.expiresAt) cart.status = 'expired';
    return c;
  }
  get(userId: string, id: string) {
    const c = this.db.data.checkouts.find((x) => x.id === id && x.userId === userId);
    return c && this.view(c);
  }
  list(userId: string) {
    return this.db.data.checkouts.filter((x) => x.userId === userId).map((c) => this.view(c)).sort((a, b) => b.createdAt - a.createdAt);
  }

  create(userId: string, input: { quoteId: string; planId: string; overrides?: Override[]; removed?: string[] }) {
    const quote = this.quotes.get(input.quoteId);
    if (!quote) throw new HttpError(404, 'quote not found or expired; compare again');
    const plan = quote.plans.find((p) => p.id === input.planId);
    if (!plan) throw new HttpError(404, 'plan not found');
    const removed = new Set(input.removed ?? []);
    const byStore = new Map<StoreId, Line[]>();
    for (const part of plan.parts) byStore.set(part.store, part.lines.filter((l) => !removed.has(l.itemId)).map((l) => ({ ...l })));
    for (const o of input.overrides ?? []) {
      const item = quote.items.find((i) => i.id === o.itemId);
      const sku = this.quotes.providers.get(o.store)?.getSku(o.skuId);
      if (!item || !sku) throw new HttpError(400, `invalid override for item ${o.itemId}`);
      const allowed = new Set([item.key, ...(itemByKey.get(item.key)?.subs ?? [])]);
      if (!allowed.has(sku.itemKey)) throw new HttpError(400, `${sku.name} is not a substitute for ${item.name}`);
      if (!sku.inStock) throw new HttpError(409, `${sku.name} is out of stock`);
      for (const [st, ls] of byStore) byStore.set(st, ls.filter((l) => l.itemId !== o.itemId));
      const target = byStore.get(o.store) ?? [];
      target.push({
        itemId: o.itemId,
        store: o.store,
        sku,
        packs: o.packs,
        covered: o.packs * sku.size,
        price: o.packs * sku.price, // re-priced server-side, never trusted from the client
        substitution: sku.itemKey !== item.key || (item.brand && sku.brand !== item.brand) ? { reason: 'Chosen by you', wanted: item.brand ?? item.name } : undefined,
        alternatives: [],
      });
      byStore.set(o.store, target);
    }
    const inputs = this.quotes.inputs.get(quote.id) ?? [];
    const carts: Cart[] = [...byStore.entries()]
      .filter(([, ls]) => ls.length)
      .map(([store, lines]) => {
        const p = this.quotes.providers.get(store)!;
        const subtotal = lines.reduce((a, l) => a + l.price, 0);
        const fees = p.fees(subtotal);
        return {
          store,
          storeName: STORES[store].name,
          lines,
          subtotal,
          fees,
          total: subtotal + feeTotal(fees),
          etaLabel: inputs.find((i) => i.store === store)?.etaLabel ?? '',
          status: 'queued' as CartStatus,
          failed: [],
          appUrl: STORES[store].app,
          webUrl: STORES[store].web,
        };
      });
    if (!carts.length) throw new HttpError(400, 'nothing left in the basket');
    const checkout: Checkout = {
      id: randomUUID(),
      userId,
      quoteId: quote.id,
      planId: plan.id,
      planLabel: plan.label,
      status: 'filling',
      carts,
      total: carts.reduce((a, c) => a + c.total, 0),
      jobId: '',
      createdAt: Date.now(),
      sample: quote.sample,
    };
    const job = this.queue.enqueue<Checkout, FillProgress>('fill-cart', async (report, signal) => {
      for (const cart of checkout.carts) {
        cart.status = 'filling';
        const p = this.quotes.providers.get(cart.store)!;
        try {
          const r = await p.fillCart(
            cart.lines.map((l) => ({ skuId: l.sku.id, name: `${l.sku.name} ${l.sku.sizeLabel}`, packs: l.packs })),
            { onProgress: report, signal },
          );
          cart.failed = r.failed;
          cart.verifiedTotal = r.verifiedTotal;
          cart.status = r.failed.length ? 'partial' : 'ready';
        } catch (e) {
          cart.status = 'failed';
          cart.failed = [{ skuId: '*', reason: (e as Error).message }];
        }
        cart.readyAt = Date.now();
        cart.expiresAt = Date.now() + this.cfg.PAYMENT_WINDOW_MINUTES * 60_000;
      }
      const ready = checkout.carts.filter((c) => c.status === 'ready' || c.status === 'partial');
      checkout.status = 'ready_to_pay';
      this.db.save();
      if (ready.length) {
        const amount = ready.reduce((a, c) => a + (c.verifiedTotal ?? c.total), 0);
        const where = ready.map((c) => STORES[c.store].short).join(' + ');
        this.notify.notify(userId, {
          kind: 'ready_to_pay',
          title: `Cart ready: confirm & pay ₹${amount.toLocaleString('en-IN')}`,
          body: `${where} cart${ready.length > 1 ? 's are' : ' is'} filled. Review and pay in the store app (UPI / card). Akaya never pays for you.${checkout.sample ? ' Sample data.' : ''}`,
          link: `#/checkout/${checkout.id}`,
          data: { checkoutId: checkout.id, amount },
        });
      }
      return checkout;
    });
    checkout.jobId = job.id;
    this.db.data.checkouts.push(checkout);
    this.db.data.checkouts = this.db.data.checkouts.slice(-100);
    this.db.save();
    return checkout;
  }

  private cart(userId: string, id: string, store: StoreId) {
    const c = this.get(userId, id);
    if (!c) throw new HttpError(404, 'checkout not found');
    const cart = c.carts.find((x) => x.store === store);
    if (!cart) throw new HttpError(404, 'no cart for that store');
    return { c, cart };
  }

  /** User tapped "Confirm & open app": hand off to the store app/web for payment. */
  handoff(userId: string, id: string, store: StoreId) {
    const { cart } = this.cart(userId, id, store);
    if (cart.status === 'expired') throw new HttpError(409, 'Prices may have changed: refresh the basket before paying');
    if (!['ready', 'partial', 'handed_off'].includes(cart.status)) throw new HttpError(409, `cart is ${cart.status}`);
    cart.status = 'handed_off';
    cart.handedOffAt = Date.now();
    this.db.save();
    return {
      store,
      storeName: cart.storeName,
      amount: cart.verifiedTotal ?? cart.total,
      appUrl: cart.appUrl,
      webUrl: cart.webUrl,
      steps: [
        `Open ${cart.storeName}. Your cart is already filled.`,
        'Check items, address and delivery slot.',
        'Pay with UPI, card or wallet and approve the OTP / UPI PIN yourself.',
        'Come back and tap "I\'ve paid" to start tracking.',
      ],
      note: 'Payment happens only in the store app, approved by you. Akaya never places the order for you.',
    };
  }

  /** The user says they paid in the store app. Recorded as user-confirmed; never automatic. */
  markPaid(userId: string, id: string, store: StoreId) {
    const { c, cart } = this.cart(userId, id, store);
    if (cart.status !== 'handed_off') throw new HttpError(409, 'Open the store app to pay first (confirm step)');
    const order: Order = {
      id: randomUUID(),
      userId,
      checkoutId: c.id,
      store,
      storeName: cart.storeName,
      items: cart.lines.map((l) => ({ name: l.sku.name, packs: l.packs, sizeLabel: l.sku.sizeLabel, emoji: l.sku.emoji })),
      total: cart.verifiedTotal ?? cart.total,
      placedAt: Date.now(),
      etaMin: this.quotes.inputs.get(c.quoteId)?.find((i) => i.store === store)?.etaMin ?? 15,
      etaLabel: cart.etaLabel,
      sample: c.sample,
    };
    cart.status = 'paid_by_user';
    cart.orderId = order.id;
    if (c.carts.every((x) => ['paid_by_user', 'cancelled', 'failed'].includes(x.status))) c.status = 'completed';
    this.db.data.orders.push(order);
    this.db.save();
    return order;
  }

  cancel(userId: string, id: string, store?: StoreId) {
    const c = this.get(userId, id);
    if (!c) throw new HttpError(404, 'checkout not found');
    for (const cart of c.carts) if ((!store || cart.store === store) && cart.status !== 'paid_by_user') cart.status = 'cancelled';
    if (c.carts.every((x) => ['paid_by_user', 'cancelled', 'failed'].includes(x.status))) c.status = c.carts.some((x) => x.status === 'paid_by_user') ? 'completed' : 'cancelled';
    this.db.save();
    return c;
  }

  // ---------- orders (mock tracking: simulated timeline, labelled sample)
  static STAGES = [
    { key: 'placed', label: 'Order placed', at: 0 },
    { key: 'packed', label: 'Packed', at: 0.3 },
    { key: 'out_for_delivery', label: 'Out for delivery', at: 0.5 },
    { key: 'arriving', label: 'Arriving', at: 0.9 },
    { key: 'delivered', label: 'Delivered', at: 1 },
  ];
  track(o: Order, now = Date.now()) {
    const total = Math.max(1, o.etaMin);
    const elapsed = ((now - o.placedAt) / 60_000) * this.cfg.ORDER_SIM_SPEED;
    const frac = Math.min(1, elapsed / total);
    const stages = CheckoutService.STAGES.map((s) => ({ ...s, done: frac >= s.at, eta: new Date(o.placedAt + ((s.at * total) / this.cfg.ORDER_SIM_SPEED) * 60_000).toISOString() }));
    const current = [...stages].reverse().find((s) => s.done)!;
    return { ...o, stage: current.key, stageLabel: current.label, progress: frac, minutesLeft: Math.max(0, Math.ceil(total - elapsed)), stages, simulated: true };
  }
  orders(userId: string) {
    return this.db.data.orders.filter((o) => o.userId === userId).sort((a, b) => b.placedAt - a.placedAt).map((o) => this.track(o));
  }
  order(userId: string, id: string) {
    const o = this.db.data.orders.find((x) => x.id === id && x.userId === userId);
    return o && this.track(o);
  }
  /** emits notifications when a tracked order goes out for delivery / is delivered */
  tickOrders() {
    for (const o of this.db.data.orders) {
      const t = this.track(o);
      if ((t.stage === 'out_for_delivery' || t.stage === 'delivered') && o.lastStage !== t.stage && !(o.lastStage === 'delivered')) {
        o.lastStage = t.stage;
        this.notify.notify(o.userId, {
          kind: 'order',
          title: t.stage === 'delivered' ? `Delivered: ${o.storeName}` : `Out for delivery: ${o.storeName}`,
          body: t.stage === 'delivered' ? `Your ${o.items.length} items have arrived.` : `Arriving in about ${t.minutesLeft} min.${o.sample ? ' (simulated tracking)' : ''}`,
          link: `#/orders/${o.id}`,
        });
        this.db.save();
      }
    }
  }
}
