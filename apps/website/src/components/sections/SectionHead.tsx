import type { Section } from '../../content/types';
import { Eyebrow } from '../ui/Chip';

/** Eyebrow + h2 + intro paragraph(s). `center` for full-width sections, left for split layouts. */
export function SectionHead({ s, center = true, intro = 1 }: { s: Section; center?: boolean; intro?: number }) {
  return (
    <div className={center ? 'head' : 'head left'}>
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h2>{s.heading}</h2>
      {s.body?.slice(0, intro).map((p) => <p key={p}>{p}</p>)}
    </div>
  );
}
