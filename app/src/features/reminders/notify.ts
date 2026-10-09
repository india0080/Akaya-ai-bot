/** Reminder → OS notification mapping (channels, action buttons, multiple alerts). Scheduling itself is native/notify.ts. */
import { alertLabel, alertTimes, CATEGORY_BY_ID, type Reminder } from '@akaya/reminders';
import { fmtWhen } from '@akaya/tz';
import type { ActionType, Channel } from '@capacitor/local-notifications';
import { cancelNative, scheduleNative, setupNotifications, type LocalItem } from '../../native/notify';

export const ACTION_TYPE = 'akaya-reminder';
export const ACTIONS = { done: 'done', snooze: 'snooze-10', reschedule: 'reschedule' } as const;

const CHANNELS: Channel[] = [
  {
    id: 'reminders',
    name: 'Reminders',
    description: 'Reminders and early alerts',
    importance: 4,
    visibility: 1,
    vibration: true,
  },
  {
    id: 'reminders-urgent',
    name: 'Urgent reminders',
    description: 'Urgent reminders: louder, and they stay until you act',
    importance: 5,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#E5484D',
  },
];
const ACTION_TYPES: ActionType[] = [
  {
    id: ACTION_TYPE,
    actions: [
      { id: ACTIONS.done, title: 'Done' },
      { id: ACTIONS.snooze, title: 'Snooze 10m' },
      { id: ACTIONS.reschedule, title: 'Reschedule' },
    ],
  },
];

export const setupReminderNotifications = () => setupNotifications(CHANNELS, ACTION_TYPES);

/** how far ahead we hand alarms to the OS; the rest are scheduled on a later sync */
const HORIZON_MS = 35 * 86400_000;
const MAX_ITEMS = 60;

export function reminderItems(list: Reminder[], now: number): LocalItem[] {
  const items: LocalItem[] = [];
  for (const r of list) {
    if (r.status === 'done') continue;
    const urgent = r.priority === 'urgent';
    for (const at of alertTimes(r, now)) {
      if (at > now + HORIZON_MS) continue;
      const before = Math.round((r.due - at) / 60_000);
      const atTime = before <= 0;
      items.push({
        key: `rem:${r.id}:${at}`,
        at,
        title: `${urgent ? 'Urgent · ' : ''}${r.title}`,
        body: atTime
          ? `${r.snoozedUntil === at ? 'Snoozed reminder' : 'Due now'} · ${CATEGORY_BY_ID[r.category].label}`
          : `${alertLabel(before).replace(' before', '')} to go · ${fmtWhen(r.due)}`,
        channelId: urgent ? 'reminders-urgent' : 'reminders',
        actionTypeId: ACTION_TYPE,
        ongoing: urgent && atTime,
        extra: { reminderId: r.id },
      });
    }
  }
  return items.sort((a, b) => a.at - b.at).slice(0, MAX_ITEMS);
}

const KEY = 'akaya:rem-notifs';
const sig = (i: LocalItem) => `${i.title}|${i.body}|${i.channelId}|${i.ongoing ? 1 : 0}`;

/** diff against what we scheduled last time: cancel removed alarms, (re)schedule new or changed ones */
export async function syncReminderNotifications(list: Reminder[], now = Date.now()): Promise<void> {
  const want = reminderItems(list, now);
  let had: Record<string, string> = {};
  try {
    had = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, string>;
  } catch {
    /* start over */
  }
  const next = Object.fromEntries(want.map((i) => [i.key, sig(i)]));
  await setupReminderNotifications();
  await cancelNative(Object.keys(had).filter((k) => !(k in next)));
  await scheduleNative(want.filter((i) => had[i.key] !== next[i.key]));
  localStorage.setItem(KEY, JSON.stringify(next));
}
