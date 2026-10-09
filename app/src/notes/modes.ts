import type { IconName } from '@akaya/ui';
import type { NoteModeId } from './types';

export interface NoteMode {
  id: NoteModeId;
  label: string;
  short: string;
  icon: IconName;
  tone: 'blue' | 'violet' | 'cyan' | 'green' | 'orange' | 'pink';
  /** what the notes focus on */
  focus: string;
  /** heading used for the structured notes panel */
  notesTitle: string;
  defaultTitle: string;
  defaultSubject: string;
  /** which sample script the demo streams */
  demo: 'lecture' | 'business';
}

export const MODES: NoteMode[] = [
  {
    id: 'lecture',
    label: 'Lecture notes',
    short: 'Lecture',
    icon: 'cap',
    tone: 'blue',
    focus: 'Topics, definitions, formulas and homework',
    notesTitle: 'Lecture notes',
    defaultTitle: 'Linear Algebra – Chapter 3',
    defaultSubject: 'Mathematics',
    demo: 'lecture',
  },
  {
    id: 'meeting',
    label: 'Meeting notes',
    short: 'Meeting',
    icon: 'users',
    tone: 'violet',
    focus: 'Agenda, discussion points and next steps',
    notesTitle: 'Meeting notes',
    defaultTitle: 'Team sync',
    defaultSubject: 'Team',
    demo: 'business',
  },
  {
    id: 'business',
    label: 'Business meeting',
    short: 'Business',
    icon: 'brief',
    tone: 'orange',
    focus: 'Attendees, decisions, action items with owners and dates',
    notesTitle: 'Minutes of meeting',
    defaultTitle: 'Q4 launch plan',
    defaultSubject: 'Business',
    demo: 'business',
  },
  {
    id: 'memo',
    label: 'Voice memo',
    short: 'Memo',
    icon: 'mic',
    tone: 'cyan',
    focus: 'A clean transcript with a short summary',
    notesTitle: 'Memo',
    defaultTitle: 'Quick memo',
    defaultSubject: 'Personal',
    demo: 'lecture',
  },
  {
    id: 'interview',
    label: 'Interview',
    short: 'Interview',
    icon: 'chat',
    tone: 'green',
    focus: 'Questions, answers and highlights',
    notesTitle: 'Interview notes',
    defaultTitle: 'Candidate interview',
    defaultSubject: 'Hiring',
    demo: 'business',
  },
  {
    id: 'call',
    label: 'Call summary',
    short: 'Call',
    icon: 'phone',
    tone: 'pink',
    focus: 'What was agreed and follow-ups',
    notesTitle: 'Call notes',
    defaultTitle: 'Client call',
    defaultSubject: 'Clients',
    demo: 'business',
  },
  {
    id: 'ideas',
    label: 'Ideas & journal',
    short: 'Ideas',
    icon: 'bulb',
    tone: 'orange',
    focus: 'Themes, ideas and next steps',
    notesTitle: 'Ideas',
    defaultTitle: 'Ideas',
    defaultSubject: 'Journal',
    demo: 'lecture',
  },
  {
    id: 'podcast',
    label: 'Podcast / talk',
    short: 'Podcast',
    icon: 'podcast',
    tone: 'violet',
    focus: 'Key takeaways and quotes',
    notesTitle: 'Takeaways',
    defaultTitle: 'Talk notes',
    defaultSubject: 'Learning',
    demo: 'lecture',
  },
];

export const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<NoteModeId, NoteMode>;

export const LANGS = [
  { id: 'en-IN', label: 'English (India)', short: 'EN' },
  { id: 'hi-IN', label: 'हिन्दी (Hindi)', short: 'हि' },
] as const;
