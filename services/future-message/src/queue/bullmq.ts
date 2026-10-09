import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import type { JobQueue } from './types.js';

/**
 * Redis-backed delayed jobs (BullMQ). Survives restarts and scales to several workers.
 * jobId = message id, so a message has at most one pending job.
 */
export class BullQueue implements JobQueue {
  private queue: Queue;
  private worker: Worker | null = null;
  constructor(
    private connection: ConnectionOptions,
    private name = 'future-message',
    private now: () => number = Date.now,
  ) {
    this.queue = new Queue(name, { connection });
  }
  async enqueue(id: string, runAt: number) {
    await this.remove(id);
    await this.queue.add('send', { id }, { jobId: id, delay: Math.max(0, runAt - this.now()), removeOnComplete: 1000, removeOnFail: 5000 });
  }
  async remove(id: string) {
    const job = await this.queue.getJob(id);
    if (job) await job.remove().catch(() => {});
  }
  start(handler: (id: string) => Promise<void>) {
    this.worker = new Worker(this.name, async (job) => handler(job.data.id as string), { connection: this.connection, concurrency: 8 });
  }
  async close() {
    await this.worker?.close();
    await this.queue.close();
  }
}
