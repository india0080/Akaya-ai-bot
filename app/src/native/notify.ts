/**
 * Local notifications shared by Future Message and Reminders.
 * Native (APK): @capacitor/local-notifications, scheduled with the OS (exact alarms when allowed) so they fire even if
 * Akaya is closed, and survive a reboot (the plugin restores them).
 * Web: the Notification API when the user allows it, otherwise only the in-app inbox / banner.
 */
import { Capacitor } from '@capacitor/core';
import type { ActionType, Channel } from '@capacitor/local-notifications';

export const isNative = Capacitor.isNativePlatform();

const ln = async () => (await import('@capacitor/local-notifications')).LocalNotifications;

/** stable 31-bit int id from a string key (Android needs ints) */
export function notifId(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 2147483000;
}

export async function ensureNotifyPermission(): Promise<boolean> {
  try {
    if (isNative) {
      const L = await ln();
      let p = await L.checkPermissions();
      if (p.display !== 'granted') p = await L.requestPermissions();
      return p.display === 'granted';
    }
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

/** Android 12+ "Alarms & reminders" special access. 'n/a' on web / older Android. */
export async function exactAlarmStatus(): Promise<'granted' | 'denied' | 'n/a'> {
  if (!isNative) return 'n/a';
  try {
    const s = await (await ln()).checkExactNotificationSetting();
    return s.exact_alarm === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'n/a';
  }
}

/** opens the system "Alarms & reminders" screen for Akaya; resolves with the new state */
export async function requestExactAlarms(): Promise<'granted' | 'denied' | 'n/a'> {
  if (!isNative) return 'n/a';
  try {
    const s = await (await ln()).changeExactNotificationSetting();
    return s.exact_alarm === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'n/a';
  }
}

/** one OS notification to schedule */
export interface LocalItem {
  /** stable string key; the numeric id is derived from it */
  key: string;
  at: number;
  title: string;
  body: string;
  /** Android channel id (see setupNotifications) */
  channelId?: string;
  /** registered action type id (buttons) */
  actionTypeId?: string;
  /** cannot be swiped away until acted on */
  ongoing?: boolean;
  extra?: Record<string, unknown>;
}

let setup: Promise<void> | null = null;
/** register Android channels and action-button types once per launch (idempotent) */
export function setupNotifications(channels: Channel[], actionTypes: ActionType[]): Promise<void> {
  if (!isNative) return Promise.resolve();
  setup ??= (async () => {
    try {
      const L = await ln();
      for (const c of channels) await L.createChannel(c);
      await L.registerActionTypes({ types: actionTypes });
    } catch {
      /* plugin missing: notifications still post on the default channel */
    }
  })();
  return setup;
}

/**
 * schedule (or replace) notifications. Exact alarms are requested only when already granted, so a sync never pops the
 * settings screen by surprise; the Reminders screen offers the explicit "Allow exact alarms" button.
 */
export async function scheduleNative(items: LocalItem[]): Promise<void> {
  if (!isNative || !items.length) return;
  try {
    const L = await ln();
    const exact = (await exactAlarmStatus()) !== 'denied';
    await L.schedule({
      notifications: items.map((n) => ({
        id: notifId(n.key),
        title: n.title,
        body: n.body,
        channelId: n.channelId,
        actionTypeId: n.actionTypeId,
        ongoing: n.ongoing,
        autoCancel: !n.ongoing,
        isExactNotification: exact,
        schedule: { at: new Date(Math.max(n.at, Date.now() + 1500)), allowWhileIdle: true },
        extra: { key: n.key, ...n.extra },
      })),
    });
  } catch {
    /* permission denied or plugin missing: the in-app state still updates */
  }
}

export async function cancelNative(keys: string[]): Promise<void> {
  if (!isNative || !keys.length) return;
  try {
    await (await ln()).cancel({ notifications: keys.map((k) => ({ id: notifId(k) })) });
  } catch {
    /* ignore */
  }
}

/** notification button / tap handler (cold starts deliver the retained event once the listener is added) */
export function onNativeAction(cb: (actionId: string, extra: Record<string, unknown>) => void): () => void {
  if (!isNative) return () => {};
  let handle: { remove: () => Promise<void> } | undefined;
  let gone = false;
  void ln().then((L) =>
    L.addListener('localNotificationActionPerformed', (e) =>
      cb(e.actionId, (e.notification.extra ?? {}) as Record<string, unknown>),
    ).then((h) => {
      if (gone) void h.remove();
      else handle = h;
    }),
  );
  return () => {
    gone = true;
    void handle?.remove();
  };
}

/** Future Message: one notification per message */
export async function scheduleLocal(id: string, at: number, title: string, body: string): Promise<void> {
  await cancelNative([id]);
  await scheduleNative([{ key: id, at, title, body, extra: { fm: id } }]);
}

export const cancelLocal = (id: string): Promise<void> => cancelNative([id]);

/** show a notification now (web; native already fired via the OS schedule) */
export function showNow(title: string, body: string): void {
  if (isNative) return;
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted')
      new Notification(title, { body, icon: './icons/icon-192.png' });
  } catch {
    /* ignore */
  }
}
