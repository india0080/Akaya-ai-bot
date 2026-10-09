/**
 * Local notifications for Future Message (demo mode).
 * Native (APK): @capacitor/local-notifications, scheduled with the OS so they fire even if Akaya is closed.
 * Web: the Notification API when the user allows it, otherwise only the in-app inbox/toast.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

const ln = async () => (await import('@capacitor/local-notifications')).LocalNotifications;

/** stable 31-bit int id from a string id (Android needs ints) */
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

/** schedule an OS notification at `at` (native only; web relies on the in-app scheduler) */
export async function scheduleLocal(id: string, at: number, title: string, body: string): Promise<void> {
  if (!isNative) return;
  try {
    const L = await ln();
    await L.cancel({ notifications: [{ id: notifId(id) }] }).catch(() => {});
    await L.schedule({
      notifications: [
        {
          id: notifId(id),
          title,
          body,
          schedule: { at: new Date(Math.max(at, Date.now() + 1500)), allowWhileIdle: true },
          extra: { fm: id },
        },
      ],
    });
  } catch {
    /* permission denied or plugin missing: in-app status still updates */
  }
}

export async function cancelLocal(id: string): Promise<void> {
  if (!isNative) return;
  try {
    const L = await ln();
    await L.cancel({ notifications: [{ id: notifId(id) }] });
  } catch {
    /* ignore */
  }
}

/** show a notification now (web; native already fired via scheduleLocal) */
export function showNow(title: string, body: string): void {
  if (isNative) return;
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted')
      new Notification(title, { body, icon: './icons/icon-192.png' });
  } catch {
    /* ignore */
  }
}
