/**
 * Minimal in-process job queue with concurrency, progress events and job status.
 * Production: replace with BullMQ (Redis) or a cloud queue; keep the same `enqueue/get/on` API.
 */
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

export type JobStatus = 'queued' | 'running' | 'done' | 'failed';
export interface Job<R = unknown, P = unknown> {
  id: string;
  type: string;
  status: JobStatus;
  progress: P[];
  result?: R;
  error?: string;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
}

type Runner<R, P> = (report: (p: P) => void, signal: AbortSignal) => Promise<R>;

export class JobQueue extends EventEmitter {
  private jobs = new Map<string, Job>();
  private waiting: { job: Job; run: Runner<unknown, unknown> }[] = [];
  private running = 0;
  constructor(
    private concurrency = 4,
    private keepMs = 30 * 60 * 1000,
  ) {
    super();
    this.setMaxListeners(200);
  }

  enqueue<R, P>(type: string, run: Runner<R, P>): Job<R, P> {
    const job: Job<R, P> = { id: randomUUID(), type, status: 'queued', progress: [], createdAt: Date.now() };
    this.jobs.set(job.id, job as Job);
    this.waiting.push({ job: job as Job, run: run as Runner<unknown, unknown> });
    this.emit('job', job);
    queueMicrotask(() => this.pump());
    return job;
  }

  /** Register a job that is already finished (e.g. a cache hit) so clients use one flow. */
  done<R>(type: string, result: R): Job<R> {
    const job: Job<R> = { id: randomUUID(), type, status: 'done', progress: [], result, createdAt: Date.now(), finishedAt: Date.now() };
    this.jobs.set(job.id, job as Job);
    return job;
  }

  get(id: string) {
    return this.jobs.get(id);
  }

  stats() {
    return { running: this.running, waiting: this.waiting.length, total: this.jobs.size };
  }

  private pump() {
    while (this.running < this.concurrency && this.waiting.length) {
      const { job, run } = this.waiting.shift()!;
      this.running++;
      job.status = 'running';
      job.startedAt = Date.now();
      this.emit(job.id, { type: 'status', job });
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 60_000);
      run((p) => {
        job.progress.push(p);
        this.emit(job.id, { type: 'progress', job, progress: p });
      }, ctrl.signal)
        .then((r) => {
          job.result = r;
          job.status = 'done';
        })
        .catch((e: Error) => {
          job.error = e.message;
          job.status = 'failed';
        })
        .finally(() => {
          clearTimeout(timeout);
          job.finishedAt = Date.now();
          this.running--;
          this.emit(job.id, { type: 'status', job });
          setTimeout(() => this.jobs.delete(job.id), this.keepMs).unref?.();
          this.pump();
        });
    }
  }
}
