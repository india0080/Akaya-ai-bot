/**
 * Saved lists + weekly schedules (times in IST). When a schedule is due, the agent quotes the list
 * and either fills the cart (autoFill → "ready to pay" notification) or asks the user to review.
 * Even with autoFill, payment always waits for the user.
 */
import { randomUUID } from 'node:crypto';
import { parseList } from '../engine/listParser.js';
import type { Strategy, StoreId } from '../types.js';
import type { CheckoutService } from './checkout.js';
import type { JsonDb } from './db.js';
import type { NotificationService } from './notifications.js';
import type { JobQueue } from './queue.js';
import type { Quote, QuoteService } from './quotes.js';

export interface Schedule {
  enabled: boolean;
  /** 0 = Sunday … 6 = Saturday */
  days: number[];
  /** "HH:MM" IST */
  time: string;
  strategy: Strategy;
  autoFill: boolean;
}
export interface SavedList {
  id: string;
  userId: string;
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
export interface ListState {
  lists: SavedList[];
  settings: Record<string, Settings>;
}

const IST_OFFSET = 330; // minutes
/** next run (epoch ms) for a weekly schedule, evaluated in IST */
export function nextRun(s: Schedule, from = Date.now()): number | undefined {
  if (!s.enabled || !s.days.length) return undefined;
  const [hh, mm] = s.time.split(':').map(Number);
  const ist = new Date(from + IST_OFFSET * 60_000); // shifted clock: use UTC getters as IST
  for (let d = 0; d <= 7; d++) {
    const day = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + d, hh, mm));
    const t = day.getTime() - IST_OFFSET * 60_000;
    if (s.days.includes(day.getUTCDay()) && t > from) return t;
  }
  return undefined;
}

export class ListService {
  private timer: NodeJS.Timeout | null = null;
  constructor(
    private db: JsonDb<ListState & object>,
    private quotes: QuoteService,
    private queue: JobQueue,
    private checkout: CheckoutService,
    private notify: NotificationService,
    private defaults: Settings,
  ) {}

  settings(userId: string): Settings {
    return { ...this.defaults, ...(this.db.data.settings[userId] ?? {}) };
  }
  updateSettings(userId: string, patch: Partial<Settings>) {
    this.db.data.settings[userId] = { ...this.settings(userId), ...patch };
    this.db.save();
    return this.settings(userId);
  }

  list(userId: string) {
    return this.db.data.lists.filter((l) => l.userId === userId).sort((a, b) => b.updatedAt - a.updatedAt);
  }
  get(userId: string, id: string) {
    return this.db.data.lists.find((l) => l.userId === userId && l.id === id);
  }
  create(userId: string, b: Pick<SavedList, 'name' | 'text'> & Partial<Pick<SavedList, 'emoji' | 'budget' | 'schedule'>>) {
    const l: SavedList = { id: randomUUID(), userId, emoji: b.emoji ?? '🛒', name: b.name, text: b.text, budget: b.budget, schedule: b.schedule, createdAt: Date.now(), updatedAt: Date.now() };
    l.nextRunAt = l.schedule ? nextRun(l.schedule) : undefined;
    this.db.data.lists.push(l);
    this.db.save();
    return l;
  }
  update(userId: string, id: string, patch: Partial<Pick<SavedList, 'name' | 'text' | 'emoji' | 'budget' | 'schedule'>>) {
    const l = this.get(userId, id);
    if (!l) return null;
    Object.assign(l, patch, { updatedAt: Date.now() });
    l.nextRunAt = l.schedule ? nextRun(l.schedule) : undefined;
    this.db.save();
    return l;
  }
  remove(userId: string, id: string) {
    const n = this.db.data.lists.length;
    this.db.data.lists = this.db.data.lists.filter((l) => !(l.userId === userId && l.id === id));
    this.db.save();
    return n !== this.db.data.lists.length;
  }

  private waitJob<T>(job: { id: string; status: string; result?: unknown; error?: string }): Promise<T> {
    if (job.status === 'done') return Promise.resolve(job.result as T);
    return new Promise((resolve, reject) => {
      const on = () => {
        if (job.status === 'done' || job.status === 'failed') {
          this.queue.off(job.id, on);
          if (job.status === 'done') resolve(job.result as T);
          else reject(new Error(job.error));
        }
      };
      this.queue.on(job.id, on);
    });
  }

  /** Run a saved list now (also used by the scheduler). */
  async run(userId: string, id: string, opts: { autoFill?: boolean; scheduled?: boolean } = {}) {
    const l = this.get(userId, id);
    if (!l) return null;
    const st = this.settings(userId);
    const quote = await this.waitJob<Quote>(this.quotes.start({ text: l.text, pincode: st.pincode, address: st.address, budget: l.budget ?? st.budget, stores: st.stores }));
    l.lastRunAt = Date.now();
    l.lastQuoteId = quote.id;
    if (l.schedule) l.nextRunAt = nextRun(l.schedule);
    this.db.save();
    const strategy = l.schedule?.strategy ?? st.strategy;
    const plan = quote.plans.find((p) => p.strategy === strategy) ?? quote.plans[0];
    const autoFill = opts.autoFill ?? l.schedule?.autoFill ?? false;
    if (plan && autoFill) {
      const c = this.checkout.create(userId, { quoteId: quote.id, planId: plan.id });
      return { quote, checkoutId: c.id };
    }
    if (plan)
      this.notify.notify(userId, {
        kind: 'list_ready',
        title: `${opts.scheduled ? 'Weekly list' : l.name}: best ₹${plan.total.toLocaleString('en-IN')} (${plan.label.toLowerCase()})`,
        body: `${quote.items.length} items compared across ${quote.quotes.length} stores. Tap to review the basket.${quote.sample ? ' Sample data.' : ''}`,
        link: `#/compare/${quote.id}`,
      });
    return { quote };
  }

  /** scheduler tick: runs due lists */
  async tick(now = Date.now()) {
    for (const l of this.db.data.lists) {
      if (l.schedule?.enabled && l.nextRunAt && l.nextRunAt <= now) {
        l.nextRunAt = nextRun(l.schedule, now);
        await this.run(l.userId, l.id, { scheduled: true }).catch(() => {});
      }
    }
  }
  start(ms: number) {
    if (this.timer || ms <= 0) return;
    this.timer = setInterval(() => void this.tick(), ms);
    this.timer.unref?.();
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

export { parseList };
