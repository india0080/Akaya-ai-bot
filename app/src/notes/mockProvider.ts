/**
 * MockNotesProvider: builds structured notes on the device with simple rules, so the app works
 * offline and in demos. Sample scripts carry structure hints; live speech uses the heuristics
 * below. Replace with LlmNotesProvider (see ./index.ts) for real summaries.
 */
import { MODE_BY_ID } from './modes';
import type { ActionItem, MindNode, NoteMeta, NoteSection, NotesProvider, Segment, StructuredNotes } from './types';

const FILLER = /\b(um+|uh+|you know|basically|actually|like,|so,)\s*/gi;
const STOP = new Set(
  'about after again also because been before being could does doing from going have here into just more most much only other over really said should some than that their them then there these they thing think this those very want were what when where which while will with would your today'.split(
    ' ',
  ),
);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function clean(text: string, max = 18): string {
  const t = text
    .replace(FILLER, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+$/, '');
  const w = t.split(' ');
  return cap(w.length > max ? w.slice(0, max).join(' ') + '…' : t);
}
function keyword(texts: string[]): string | null {
  const count = new Map<string, number>();
  for (const t of texts)
    for (const w of t.toLowerCase().match(/[a-z]{5,}/g) ?? []) if (!STOP.has(w)) count.set(w, (count.get(w) ?? 0) + 1);
  let best: string | null = null;
  let n = 0;
  for (const [w, c] of count) if (c > n || (c === n && best && w.length > best.length)) [best, n] = [w, c];
  return best ? cap(best) : null;
}
const shortLabel = (s: string, words = 3) =>
  s
    .split(' ')
    .slice(0, words)
    .join(' ')
    .replace(/[,:;·]$/, '');

/** Build notes synchronously from transcript segments. */
export function buildNotes(segments: Segment[], meta: NoteMeta): StructuredNotes {
  const mode = MODE_BY_ID[meta.mode];
  const meetingish = ['meeting', 'business', 'call', 'interview'].includes(meta.mode);
  const sections: (NoteSection & { ideas: string[] })[] = [];
  const terms: StructuredNotes['terms'] = [];
  const attendees = new Set<string>();
  const decisions: string[] = [];
  const actions: ActionItem[] = [];
  const summary: string[] = [];
  let loose: string[] = [];

  const current = () => {
    if (!sections.length) sections.push({ heading: meetingish ? 'Discussion' : 'Overview', points: [], ideas: [] });
    return sections[sections.length - 1];
  };
  const open = (heading: string) => {
    if (current().heading !== heading || current().points.length) sections.push({ heading, points: [], ideas: [] });
  };

  for (const s of segments) {
    if (s.speaker) attendees.add(s.speaker);
    const h = s.hint;
    if (h) {
      h.attendees?.forEach((a) => attendees.add(a));
      if (h.section) {
        if (!sections.length) sections.push({ heading: h.section, points: [], ideas: [] });
        else open(h.section);
      }
      const sec = current();
      if (h.point) sec.points.push(h.point);
      if (h.formula) sec.formula = sec.formula ? `${sec.formula}\n${h.formula}` : h.formula;
      if (h.idea && sec.ideas.length < 3) sec.ideas.push(h.idea);
      if (h.term) terms.push({ term: h.term[0], def: h.term[1] });
      if (h.decision) decisions.push(h.decision);
      if (h.action) actions.push({ id: s.id, ...h.action });
      if (h.summary) summary.push(h.summary);
      continue;
    }
    // live speech heuristics
    const text = s.text.trim();
    if (!text) continue;
    const term = text.match(
      /^(?:an? |the )?([\w\s-]{3,30}?) (?:is called|is defined as|means|refers to) (.{5,90}?)[.!?]?$/i,
    );
    if (term) terms.push({ term: cap(term[1].trim()), def: cap(term[2].trim()) });
    const act = text.match(
      /\b(I|we|[A-Z][a-z]{2,})(?: will|'ll| needs? to| should| has to) (.{4,70}?)(?: by ([\w\s]{2,20}?))?[.!?]?$/,
    );
    if (act) {
      const who = /^(I|we)$/i.test(act[1]) ? 'You' : act[1];
      actions.push({ id: s.id, text: clean(act[2], 10), owner: who, due: act[3] ? cap(act[3].trim()) : undefined });
    }
    if (/\b(we (decided|agreed)|let'?s go with|final decision|approved|decided)\b/i.test(text))
      decisions.push(clean(text, 14));
    let sec = current();
    if (sec.points.length >= 4) {
      loose = [];
      sections.push({ heading: 'Notes', points: [], ideas: [] });
      sec = current();
    }
    sec.points.push(clean(text));
    loose.push(text);
    const k = keyword(loose);
    if (sec.heading === 'Overview' || sec.heading === 'Notes' || sec.heading === 'Discussion') {
      if (k && sections.length > 0 && !segments.some((x) => x.hint?.section)) sec.heading = k;
    }
    if (sec.ideas.length < 3) sec.ideas.push(shortLabel(clean(text, 6)));
  }

  const live = sections.filter((s) => s.points.length || s.formula);
  if (!summary.length) for (const s of live.slice(0, 4)) summary.push(s.points[0]);
  const heads = live.map((s) => s.heading);
  const list = heads.length > 1 ? `${heads.slice(0, -1).join(', ')} and ${heads[heads.length - 1]}` : (heads[0] ?? '');
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
  let tldr = segments.length ? `Topics: ${list}.` : '';
  if (meetingish && segments.length)
    tldr += ` ${plural(decisions.length, 'decision')} · ${plural(actions.length, 'action item')}.`;
  else if (actions.length) tldr += ` ${plural(actions.length, 'task')} to do.`;

  const mindmap: MindNode = {
    label: meta.title || mode.defaultTitle,
    children: live
      .slice(0, 6)
      .map((s) => ({ label: s.heading, children: s.ideas.map((i) => ({ label: i, children: [] })) })),
  };

  return {
    sections: live.map(({ heading, points, formula }) => ({ heading, points, formula })),
    terms,
    attendees: [...attendees],
    decisions,
    actions,
    summary,
    tldr,
    mindmap,
  };
}

export class MockNotesProvider implements NotesProvider {
  id = 'mock';
  async update(segments: Segment[], meta: NoteMeta) {
    await new Promise((r) => setTimeout(r, 120));
    return buildNotes(segments, meta);
  }
}
