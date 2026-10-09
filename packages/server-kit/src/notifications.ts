/**
 * Notification service: in-app (Server-Sent Events) + push stubs.
 *  - SSE: GET /api/notifications/stream delivers events live to open apps.
 *  - Web Push: subscriptions are stored; sending needs VAPID keys + the `web-push` package (TODO).
 *  - FCM (Android app): needs FCM_PROJECT_ID + a service account (TODO, HTTP v1 API).
 * Delivery attempts are recorded on each notification (`channels`) so the UI shows what happened.
 */
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import type { JsonDb } from './db.js';

/** Only the push-related settings are read (VAPID for Web Push, FCM for the Android app). */
export interface PushConfig {
  VAPID_PUBLIC_KEY?: string;
  FCM_PROJECT_ID?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  kind: string;
  title: string;
  body: string;
  /** deep link inside the agent UI, e.g. #/product/xyz */
  link?: string;
  data?: Record<string, unknown>;
  createdAt: number;
  read: boolean;
  channels: { channel: 'sse' | 'webpush' | 'fcm'; status: 'sent' | 'stub' | 'no-subscribers' }[];
}

export interface NotifState {
  notifications: AppNotification[];
  pushSubs: { userId: string; kind: 'webpush' | 'fcm'; token: string; createdAt: number }[];
}

export class NotificationService extends EventEmitter {
  constructor(
    private db: JsonDb<NotifState & object>,
    private cfg: PushConfig,
    private log: (msg: string) => void = () => {},
  ) {
    super();
    this.setMaxListeners(500);
  }

  list(userId: string) {
    return this.db.data.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  }

  markRead(userId: string, id?: string) {
    for (const n of this.db.data.notifications) if (n.userId === userId && (!id || n.id === id)) n.read = true;
    this.db.save();
  }

  subscribe(userId: string, kind: 'webpush' | 'fcm', token: string) {
    this.db.data.pushSubs = this.db.data.pushSubs.filter((s) => s.token !== token);
    this.db.data.pushSubs.push({ userId, kind, token, createdAt: Date.now() });
    this.db.save();
  }

  notify(userId: string, n: Pick<AppNotification, 'kind' | 'title' | 'body' | 'link' | 'data'>): AppNotification {
    const listeners = this.listenerCount(`user:${userId}`);
    const subs = this.db.data.pushSubs.filter((s) => s.userId === userId);
    const note: AppNotification = {
      id: randomUUID(),
      userId,
      ...n,
      createdAt: Date.now(),
      read: false,
      channels: [
        { channel: 'sse', status: listeners ? 'sent' : 'no-subscribers' },
        { channel: 'webpush', status: subs.some((s) => s.kind === 'webpush') ? 'stub' : 'no-subscribers' },
        { channel: 'fcm', status: subs.some((s) => s.kind === 'fcm') ? 'stub' : 'no-subscribers' },
      ],
    };
    this.db.data.notifications.push(note);
    this.db.data.notifications = this.db.data.notifications.slice(-300);
    this.db.save();
    this.emit(`user:${userId}`, note);
    for (const s of subs) this.sendPush(s, note);
    return note;
  }

  private sendPush(sub: NotifState['pushSubs'][number], n: AppNotification) {
    if (sub.kind === 'webpush') {
      // TODO(push): `import webpush from 'web-push'`; webpush.setVapidDetails('mailto:you@example.com',
      // cfg.VAPID_PUBLIC_KEY, cfg.VAPID_PRIVATE_KEY); await webpush.sendNotification(JSON.parse(sub.token), JSON.stringify(n))
      this.log(`[push stub] webpush → ${n.title}${this.cfg.VAPID_PUBLIC_KEY ? '' : ' (VAPID keys not set)'}`);
    } else {
      // TODO(fcm): POST https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send with an OAuth token
      // from the service account; body { message: { token, notification: { title, body }, data } }
      this.log(`[push stub] fcm → ${n.title}${this.cfg.FCM_PROJECT_ID ? '' : ' (FCM not configured)'}`);
    }
  }
}
