import type { BubbleColor, Section } from '../../content/types';
import { Bubble } from '../ui/Bubble';
import { CtaRow } from '../ui/Button';
import { Eyebrow } from '../ui/Chip';
import { PhoneFrame } from '../ui/PhoneFrame';

const FLOATS: [string, string][] = [['Online AI', 'blue'], ['Offline AI', 'green'], ['Voice Assistant', 'violet'], ['99+ Languages', 'cyan']];

interface Props { s: Section; bubble?: BubbleColor; tagline?: string; floats?: boolean }

/** Page hero used by every page: text left, pearl/colour bubble (+ phone when the section has a screen) right. */
export function Hero({ s, bubble = 'pearl', tagline, floats }: Props) {
  const [first, ...rest] = s.body ?? [];
  const sub = tagline ?? undefined;
  const lead = sub ? rest[0] ?? first : first;
  const more = sub ? rest.slice(1) : rest;
  const screen = s.screens?.[0];
  return (
    <section className={`hero${screen ? '' : ' compact'}`} aria-labelledby="page-title">
      <div>
        <Eyebrow>{s.eyebrow}</Eyebrow>
        <h1 id="page-title">
          {s.heading}
          {sub && <span className="sub grad">{sub}</span>}
        </h1>
        {lead && <p className="lead">{lead}</p>}
        {more.slice(0, 2).map((p) => <p className="muted" key={p}>{p}</p>)}
        <CtaRow ctas={s.ctas} />
        {s.bullets && <p className="meta">{s.bullets.join(' • ')}</p>}
      </div>
      <div className={`stage${screen ? '' : ' solo'}`}>
        <Bubble color={bubble} size={screen ? 230 : 300} className="pearl" eager alt="Akaya bubble" />
        {screen && <PhoneFrame screen={screen} eager alt="Akaya app home screen" />}
        {floats && FLOATS.map(([t, c], i) => (
          <div className={`float f${i + 1}`} key={t}><b style={{ background: `var(--g-${c})` }} aria-hidden="true" />{t}</div>
        ))}
      </div>
    </section>
  );
}
