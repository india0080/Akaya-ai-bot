import { MODE_BY_ID } from './modes';
import type { VoiceNote } from './types';

export const fmtClock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
};

/** Markdown export of a voice note (used by Copy, Share and Export). */
export function toMarkdown(
  v: Pick<VoiceNote, 'title' | 'mode' | 'subject' | 'createdAt' | 'duration' | 'segments' | 'notes'>,
  withTranscript = true,
): string {
  const n = v.notes;
  const out: string[] = [
    `# ${v.title}`,
    '',
    `${MODE_BY_ID[v.mode].label} · ${v.subject} · ${new Date(v.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · ${fmtClock(v.duration)}`,
    '',
  ];
  if (n.tldr) out.push(`> ${n.tldr}`, '');
  if (n.attendees.length) out.push(`**Attendees:** ${n.attendees.join(', ')}`, '');
  n.sections.forEach((s, i) => {
    out.push(`## ${i + 1}. ${s.heading}`);
    if (s.formula) out.push('', `\`${s.formula}\``);
    out.push(...s.points.map((p) => `- ${p}`), '');
  });
  if (n.terms.length) out.push('## Key terms', ...n.terms.map((t) => `- **${t.term}**: ${t.def}`), '');
  if (n.decisions.length) out.push('## Decisions', ...n.decisions.map((d) => `- ${d}`), '');
  if (n.actions.length)
    out.push(
      '## Action items',
      ...n.actions.map(
        (a) =>
          `- [${a.done ? 'x' : ' '}] ${a.text}${a.owner ? ` (${a.owner}` : ''}${a.due ? `, due ${a.due}` : ''}${a.owner ? ')' : ''}`,
      ),
      '',
    );
  if (n.summary.length) out.push('## Summary', ...n.summary.map((s) => `- ${s}`), '');
  if (withTranscript && v.segments.length)
    out.push(
      '## Transcript',
      ...v.segments.map((s) => `[${fmtClock(s.t)}]${s.speaker ? ` ${s.speaker}:` : ''} ${s.text}`),
    );
  return out.join('\n');
}

export const fmtSize = (b?: number) =>
  b ? (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`) : '';
