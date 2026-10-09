import { humanSize } from '../lib/media';
import type { Attachment, ChatMode } from '../state/types';

const KIND_WORD: Record<Attachment['kind'], string> = {
  image: 'photo',
  video: 'video',
  file: 'file',
  audio: 'voice note',
  location: 'location',
  contact: 'contact',
  app: 'app',
  note: 'note',
  scan: 'scan',
  screen: 'screenshot',
  generated: 'image',
};

/** Demo reply that acknowledges attachments by name, then the base reply. */
export function replyWithAttachments(base: string, text: string, atts: Attachment[], modes: ChatMode[]): string {
  const parts: string[] = [];
  if (modes.includes('web')) parts.push('Web search (demo): checked 3 sources.');
  if (modes.includes('deep')) parts.push('Deep think (demo): weighed it step by step.');
  if (atts.length) {
    const list = atts
      .map((a) => {
        const size = a.size ? `, ${humanSize(a.size)}` : '';
        if (a.kind === 'location') return `your location (${a.meta})`;
        if (a.kind === 'contact') return `${a.name}'s contact`;
        if (a.kind === 'app') return `${a.name}`;
        if (a.kind === 'note') return `your note "${a.name.slice(0, 40)}"`;
        return `${a.name} (${KIND_WORD[a.kind]}${size})`;
      })
      .join(', ');
    parts.push(`Got ${atts.length === 1 ? 'it' : `all ${atts.length}`}: ${list}.`);
    const docs = atts.filter((a) => a.kind === 'file' || a.kind === 'scan');
    const imgs = atts.filter((a) => a.kind === 'image' || a.kind === 'screen' || a.kind === 'video');
    if (docs.length)
      parts.push(
        `Sample summary of ${docs[0].name}: 3 key points, 1 date to remember and 2 action items. Want them as tasks?`,
      );
    if (imgs.length)
      parts.push(
        `In ${imgs[0].name} I'd look for text, people and places. (Image understanding is simulated in this demo build.)`,
      );
    if (atts.some((a) => a.kind === 'location')) parts.push('I can find places nearby or share this with someone.');
    if (atts.some((a) => a.kind === 'audio'))
      parts.push('Sample transcript: "Remind me to send the deck to Rahul tonight."');
    if (atts.some((a) => a.kind === 'contact')) parts.push('Shall I message them or save a reminder to call?');
  }
  if (modes.includes('image'))
    return `Here's an image for "${text.slice(0, 60)}". It's a sample render in this demo build.`;
  // the generic fallback adds nothing when files are attached
  if (text.trim() && !(atts.length && base.startsWith('Got it!'))) parts.push(base);
  return parts.join(' ');
}
