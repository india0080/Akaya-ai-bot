export type Priority = 'urgent' | 'high' | 'normal' | 'low';

export type CategoryId = 'health' | 'family' | 'personal' | 'finance' | 'work' | 'dates' | 'maintenance' | 'general';

export type RepeatKind = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Repeat {
  kind: RepeatKind;
  /** weekly: weekdays 0 = Sunday … 6 = Saturday (empty = the due date's weekday) */
  weekdays?: number[];
  /** custom: every N days */
  everyDays?: number;
}

export type ReminderStatus = 'pending' | 'done';

/** Dashboard tabs */
export type ReminderView = 'upcoming' | 'completed' | 'missed';

export type ReminderSource = 'chat' | 'voice' | 'form' | 'template' | 'follow-up';

export interface Reminder {
  id: string;
  title: string;
  notes?: string;
  category: CategoryId;
  priority: Priority;
  /** epoch ms */
  due: number;
  /** alerts as minutes before `due` (0 = at the time), e.g. [1440, 60, 0] */
  alerts: number[];
  repeat: Repeat;
  status: ReminderStatus;
  doneAt?: number;
  /** set by Snooze; the reminder fires again at this time */
  snoozedUntil?: number;
  createdAt: number;
  source: ReminderSource;
  /** id of the missed reminder this one follows up */
  followUpOf?: string;
  /** seeded demo data (shown with a Sample tag) */
  sample?: boolean;
}

export const ONCE: Repeat = { kind: 'none' };
