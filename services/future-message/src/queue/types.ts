/** Delayed-job queue. One job per message id; re-enqueueing replaces the previous job. */
export interface JobQueue {
  enqueue(messageId: string, runAt: number): Promise<void>;
  remove(messageId: string): Promise<void>;
  /** start consuming; the handler is called when a job is due */
  start(handler: (messageId: string) => Promise<void>): void;
  close(): Promise<void>;
}
