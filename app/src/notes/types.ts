/**
 * Voice Notes domain types. A recording is a list of timed transcript segments; a NotesProvider
 * turns those segments into structured notes (sections, summary, mind map, action items).
 */
export type NoteModeId = 'lecture' | 'meeting' | 'business' | 'memo' | 'interview' | 'call' | 'ideas' | 'podcast';
export type LectureLevel = 'School' | 'College' | 'University';
export type SpeechLang = 'en-IN' | 'hi-IN';

/** Optional structure hints carried by the demo scripts (a real LLM infers these itself). */
export interface SegmentHint {
  section?: string;
  point?: string;
  formula?: string;
  term?: [string, string];
  decision?: string;
  action?: { text: string; owner?: string; due?: string };
  attendees?: string[];
  summary?: string;
  /** short child label for the mind map */
  idea?: string;
}

export interface Segment {
  id: string;
  /** seconds from the start of the recording */
  t: number;
  text: string;
  speaker?: string;
  lang: SpeechLang;
  hint?: SegmentHint;
}

export interface NoteSection {
  heading: string;
  points: string[];
  formula?: string;
}

export interface ActionItem {
  id: string;
  text: string;
  owner?: string;
  due?: string;
  done?: boolean;
}

export interface MindNode {
  label: string;
  children: MindNode[];
}

export interface StructuredNotes {
  sections: NoteSection[];
  terms: { term: string; def: string }[];
  attendees: string[];
  decisions: string[];
  actions: ActionItem[];
  summary: string[];
  tldr: string;
  mindmap: MindNode;
}

export interface NoteMeta {
  title: string;
  mode: NoteModeId;
  subject: string;
  level?: LectureLevel;
}

/**
 * Swap-in point for a real summariser (LLM). `update` is called repeatedly while recording with
 * the full transcript so far and must return the complete, current notes.
 */
export interface NotesProvider {
  id: string;
  update(segments: Segment[], meta: NoteMeta): Promise<StructuredNotes>;
}

export interface VoiceNote extends NoteMeta {
  id: string;
  lang: SpeechLang;
  createdAt: number;
  /** seconds */
  duration: number;
  segments: Segment[];
  /** bookmark positions in seconds */
  bookmarks: number[];
  notes: StructuredNotes;
  /** true when a microphone recording is stored in IndexedDB */
  audio: boolean;
  /** bytes of stored audio */
  size?: number;
  /** recorded in demo mode (sample script, no audio) */
  sample?: boolean;
}
