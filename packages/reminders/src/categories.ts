/** Categories (icon names are @akaya/ui Icon names) and quick-add templates. */
import type { CategoryId, Priority, Repeat } from './types.js';

export interface Template {
  title: string;
  /** HH:MM (IST) */
  time: string;
  repeat: Repeat;
  priority: Priority;
  alerts: number[];
  /** days from today for the first occurrence (default: today if the time is still ahead, else tomorrow) */
  inDays?: number;
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  tone: 'green' | 'pink' | 'violet' | 'orange' | 'blue' | 'cyan';
  /** words that put a parsed reminder in this category (English, Hinglish, Hindi) */
  keywords: string[];
  templates: Template[];
}

const daily: Repeat = { kind: 'daily' };
const weekly = (...weekdays: number[]): Repeat => ({ kind: 'weekly', weekdays });
const monthly: Repeat = { kind: 'monthly' };
const yearly: Repeat = { kind: 'yearly' };
const once: Repeat = { kind: 'none' };
const every = (everyDays: number): Repeat => ({ kind: 'custom', everyDays });

export const CATEGORIES: Category[] = [
  {
    id: 'health',
    label: 'Health & Medicine',
    icon: 'heart',
    tone: 'green',
    keywords: [
      'medicine',
      'medicines',
      'tablet',
      'pill',
      'pills',
      'dawai',
      'dawa',
      'davai',
      'दवा',
      'दवाई',
      'goli',
      'गोली',
      'water',
      'paani',
      'pani',
      'पानी',
      'doctor',
      'डॉक्टर',
      'checkup',
      'check-up',
      'bp',
      'sugar',
      'insulin',
      'dentist',
      'blood test',
    ],
    templates: [
      { title: 'Take medicine', time: '09:00', repeat: daily, priority: 'high', alerts: [0] },
      { title: 'Drink water', time: '10:00', repeat: every(1), priority: 'normal', alerts: [0] },
      { title: 'Doctor visit', time: '17:00', repeat: once, priority: 'high', alerts: [1440, 60], inDays: 3 },
      { title: 'Health checkup', time: '08:00', repeat: yearly, priority: 'normal', alerts: [10080, 1440], inDays: 30 },
    ],
  },
  {
    id: 'family',
    label: 'Family & Baby Care',
    icon: 'users',
    tone: 'pink',
    keywords: [
      'vaccine',
      'vaccination',
      'teeka',
      'टीका',
      'baby',
      'school',
      'ptm',
      'homework',
      'tuition',
      'kids',
      'bachche',
      'बच्चे',
      'family',
      'mummy',
      'papa',
      'maa',
    ],
    templates: [
      {
        title: 'Baby vaccination',
        time: '10:00',
        repeat: once,
        priority: 'urgent',
        alerts: [2880, 1440, 60],
        inDays: 14,
      },
      { title: 'School PTM', time: '09:30', repeat: once, priority: 'high', alerts: [1440, 60], inDays: 5 },
      { title: 'Pack school bag', time: '20:30', repeat: weekly(0, 1, 2, 3, 4), priority: 'normal', alerts: [0] },
      { title: 'Call Maa', time: '19:00', repeat: weekly(0), priority: 'normal', alerts: [0] },
    ],
  },
  {
    id: 'personal',
    label: 'Personal Routine',
    icon: 'leaf',
    tone: 'violet',
    keywords: [
      'gym',
      'exercise',
      'workout',
      'yoga',
      'walk',
      'run',
      'study',
      'padhai',
      'पढ़ाई',
      'padhna',
      'habit',
      'meditate',
      'meditation',
      'read',
      'journal',
      'goal',
      'vyayam',
      'व्यायाम',
    ],
    templates: [
      { title: 'Morning walk', time: '06:30', repeat: daily, priority: 'normal', alerts: [0] },
      { title: 'Exercise', time: '18:30', repeat: weekly(1, 3, 5), priority: 'normal', alerts: [10, 0] },
      { title: 'Study 1 hour', time: '20:00', repeat: daily, priority: 'normal', alerts: [0] },
      { title: 'Read 20 pages', time: '22:00', repeat: daily, priority: 'low', alerts: [0] },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'wallet',
    tone: 'orange',
    keywords: [
      'bill',
      'bills',
      'emi',
      'rent',
      'kiraya',
      'किराया',
      'credit card',
      'card due',
      'insurance',
      'premium',
      'recharge',
      'tax',
      'sip',
      'loan',
      'bijli',
      'बिजली',
      'payment',
      'pay',
    ],
    templates: [
      { title: 'Electricity bill', time: '10:00', repeat: monthly, priority: 'high', alerts: [1440, 0], inDays: 5 },
      {
        title: 'Home loan EMI',
        time: '09:00',
        repeat: monthly,
        priority: 'urgent',
        alerts: [2880, 1440, 0],
        inDays: 7,
      },
      {
        title: 'Credit card due',
        time: '10:00',
        repeat: monthly,
        priority: 'urgent',
        alerts: [4320, 1440, 0],
        inDays: 10,
      },
      {
        title: 'Insurance renewal',
        time: '11:00',
        repeat: yearly,
        priority: 'high',
        alerts: [10080, 1440],
        inDays: 25,
      },
    ],
  },
  {
    id: 'work',
    label: 'Work & Business',
    icon: 'brief',
    tone: 'blue',
    keywords: [
      'meeting',
      'मीटिंग',
      'call',
      'client',
      'deadline',
      'follow up',
      'follow-up',
      'followup',
      'presentation',
      'report',
      'invoice',
      'sales',
      'interview',
      'office',
      'standup',
      'demo',
    ],
    templates: [
      { title: 'Client call', time: '11:00', repeat: once, priority: 'high', alerts: [15, 0], inDays: 1 },
      { title: 'Sales follow-up', time: '16:00', repeat: weekly(2, 4), priority: 'normal', alerts: [0] },
      { title: 'Team meeting', time: '10:30', repeat: weekly(1), priority: 'normal', alerts: [10] },
      { title: 'Project deadline', time: '18:00', repeat: once, priority: 'urgent', alerts: [1440, 120, 0], inDays: 4 },
    ],
  },
  {
    id: 'dates',
    label: 'Important Dates',
    icon: 'cal',
    tone: 'pink',
    keywords: [
      'birthday',
      'bday',
      'janamdin',
      'जन्मदिन',
      'anniversary',
      'saalgirah',
      'सालगिरह',
      'expiry',
      'expire',
      'passport',
      'licence',
      'license',
      'visa',
      'renew',
    ],
    templates: [
      { title: "Priya's birthday", time: '09:00', repeat: yearly, priority: 'high', alerts: [1440, 0], inDays: 12 },
      {
        title: 'Wedding anniversary',
        time: '09:00',
        repeat: yearly,
        priority: 'high',
        alerts: [10080, 1440],
        inDays: 40,
      },
      { title: 'Passport expiry', time: '10:00', repeat: once, priority: 'high', alerts: [43200, 10080], inDays: 90 },
      {
        title: 'Driving licence renewal',
        time: '10:00',
        repeat: once,
        priority: 'normal',
        alerts: [10080],
        inDays: 60,
      },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: 'refresh',
    tone: 'cyan',
    keywords: [
      'service',
      'servicing',
      'car',
      'bike',
      'scooty',
      'ac',
      'plumber',
      'electrician',
      'maintenance',
      'repair',
      'filter',
      'ro',
      'gas cylinder',
      'cylinder',
      'puc',
      'oil change',
    ],
    templates: [
      { title: 'Car service', time: '10:00', repeat: every(180), priority: 'normal', alerts: [1440], inDays: 20 },
      { title: 'Change RO filter', time: '10:00', repeat: every(90), priority: 'low', alerts: [0], inDays: 15 },
      { title: 'AC servicing', time: '11:00', repeat: yearly, priority: 'normal', alerts: [1440], inDays: 30 },
      { title: 'Book gas cylinder', time: '09:00', repeat: monthly, priority: 'normal', alerts: [0], inDays: 8 },
    ],
  },
  { id: 'general', label: 'General', icon: 'alarm', tone: 'violet', keywords: [], templates: [] },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;

export const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: 'urgent', label: 'Urgent', color: '#e5484d' },
  { id: 'high', label: 'High', color: '#e8743b' },
  { id: 'normal', label: 'Normal', color: '#0269f8' },
  { id: 'low', label: 'Low', color: '#8b8fa8' },
];

export const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

/** alert presets in minutes before the due time */
export const ALERT_PRESETS = [0, 5, 10, 15, 30, 60, 120, 1440, 2880, 10080];

export function alertLabel(min: number): string {
  if (min === 0) return 'At time';
  if (min < 60) return `${min} min before`;
  if (min < 1440) return `${min / 60} h before`;
  if (min % 10080 === 0) return `${min / 10080} week${min > 10080 ? 's' : ''} before`;
  return `${Math.round(min / 1440)} day${min >= 2880 ? 's' : ''} before`;
}

export const SNOOZE_MINUTES = [5, 10, 15, 30];
