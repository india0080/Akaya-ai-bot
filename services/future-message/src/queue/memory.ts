import type { JobQueue } from './types.js';

/** Single-process queue on timers. For dev and tests; jobs are lost on restart (use BullMQ in production). */
export class MemoryQueue implements JobQueue {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private handler: ((id: string) => Promise<void>) | null = null;
  private pending = new Map<string, number>();
  constructor(private now: () => number = Date.now) {}

  async enqueue(id: string, runAt: number) {
    await this.remove(id);
    this.pending.set(id, runAt);
    if (this.handler) this.arm(id, runAt);
  }
  async remove(id: string) {
    const t = this.timers.get(id);
    if (t) clearTimeout(t);
    this.timers.delete(id);
    this.pending.delete(id);
  }
  start(handler: (id: string) => Promise<void>) {
    this.handler = handler;
    for (const [id, at] of this.pending) this.arm(id, at);
  }
  private arm(id: string, runAt: number) {
    // setTimeout caps at ~24.8 days: re-arm in steps for far-future jobs
    const delay = Math.max(0, runAt - this.now());
    const step = Math.min(delay, 2 ** 31 - 1);
    this.timers.set(
      id,
      setTimeout(() => {
        if (this.now() < runAt) return this.arm(id, runAt);
        this.timers.delete(id);
        this.pending.delete(id);
        void this.handler?.(id);
      }, step),
    );
  }
  size() {
    return this.pending.size;
  }
  async close() {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }
}
