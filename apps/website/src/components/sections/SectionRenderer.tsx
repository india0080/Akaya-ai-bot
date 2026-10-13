import type { BubbleColor, Section, SectionVisual } from '../../content/types';
import { Bubble } from '../ui/Bubble';
import { CtaRow } from '../ui/Button';
import { Pills } from '../ui/Chip';
import { PhoneFrame } from '../ui/PhoneFrame';
import { FaqList } from './FaqList';
import { SectionHead } from './SectionHead';
import { pickVisual } from './pickVisual';

const ROTATE: BubbleColor[] = ['blue', 'violet', 'cyan', 'green', 'orange', 'pearl'];
const GRADS = ['blue', 'violet', 'cyan', 'orange', 'green'];
const bubbleAt = (i: number, b?: BubbleColor) => b ?? ROTATE[i % ROTATE.length];


interface Props { s: Section; index: number; legal?: boolean }

export function SectionRenderer({ s, index, legal = false }: Props) {
  const visual = pickVisual(s, legal);
  const id = s.id;
  switch (visual) {
    case 'faq':
      return (
        <section id={id} className="narrow">
          <SectionHead s={s} />
          <FaqList faqs={s.faqs!} />
          {s.body?.slice(1).map((p) => <p className="muted center" key={p}>{p}</p>)}
        </section>
      );
    case 'prose':
      return (
        <section id={id} className="prose narrow">
          <h2>{s.heading}</h2>
          {s.body?.map((p) => <p key={p}>{p}</p>)}
          {s.items?.map((it) => <p key={it.title}><b>{it.title}</b>{it.text ? ` — ${it.text}` : ''}</p>)}
          {s.bullets && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
        </section>
      );
    case 'gradient-pair': {
      const split = s.bullets?.indexOf('|') ?? -1;
      const groups = split >= 0 ? [s.bullets!.slice(0, split), s.bullets!.slice(split + 1)] : [s.bullets, []];
      return (
        <section id={id}>
          <SectionHead s={s} />
          <div className="two">
            {s.items?.map((it, i) => (
              <article key={it.title} className={`gcard g-${i ? 'cyan-green' : 'brand'}`}>
                <h3>{it.title}</h3>
                <p>{it.text}</p>
                <Pills items={groups[i]} />
              </article>
            ))}
          </div>
        </section>
      );
    }
    case 'gradient-grid':
      return (
        <section id={id}>
          <SectionHead s={s} />
          <div className="bento-g">
            {s.items?.map((it, i) => (
              <article key={it.title} className={`gcard g-${GRADS[i % GRADS.length]}`}>
                <h3>{it.title}</h3>
                <p>{it.text}</p>
              </article>
            ))}
          </div>
        </section>
      );
    case 'skills':
    case 'cards':
      return (
        <section id={id}>
          <SectionHead s={s} />
          <div className={visual === 'skills' ? 'bento' : 'three'}>
            {s.items?.map((it, i) => (
              <article key={it.title} className={visual === 'skills' ? 'skill' : 'card'}>
                <Bubble color={bubbleAt(i, it.bubble)} size={visual === 'skills' ? 52 : 64} />
                <h3>{it.title}</h3>
                {it.text && <p>{it.text}</p>}
              </article>
            ))}
          </div>
          <Pills items={s.bullets} center />
          {s.body?.slice(1).map((p) => <p className="muted center" key={p}>{p}</p>)}
        </section>
      );
    case 'chips':
      return (
        <section id={id}>
          <SectionHead s={s} />
          <ul className="langs">{s.bullets?.map((b) => <li key={b}>{b}</li>)}</ul>
        </section>
      );
    case 'apps':
      return (
        <section id={id}>
          <SectionHead s={s} />
          <ul className="apps">
            {s.items?.map((it, i) => (
              <li key={it.title} className="app"><i className={`g-${GRADS[i % GRADS.length]}`} aria-hidden="true">{it.title[0]}</i>{it.title}</li>
            ))}
          </ul>
          <Pills items={s.bullets} center />
        </section>
      );
    case 'card-list':
    case 'steps':
    case 'split-phones':
    default:
      return <SplitSection s={s} index={index} visual={visual} />;
  }
}

function SplitSection({ s, index, visual }: { s: Section; index: number; visual: SectionVisual }) {
  const art = s.screens?.length ? (
    <div className="shots">
      {s.screens.map((sc) => <PhoneFrame key={sc} screen={sc} />)}
      {s.bubble && <Bubble color={s.bubble} size={180} className="bubble big" />}
    </div>
  ) : visual === 'card-list' ? (
    <div className="card list-card">
      {s.items?.map((it) => (
        <div className="file" key={it.title}><span className="ic" aria-hidden="true">PDF</span><b>{it.title}</b>{it.text && <span className="ok">{it.text}</span>}</div>
      ))}
      {s.bullets?.map((b) => <div className="row" key={b}>{b}</div>)}
    </div>
  ) : (
    <div className="art"><Bubble color={bubbleAt(index, s.bubble)} size={260} className="bubble big" /></div>
  );
  const listInText = visual !== 'card-list';
  return (
    <section id={s.id} className={`split${index % 2 ? ' rev' : ''}`}>
      <div>
        <SectionHead s={s} center={false} intro={3} />
        {s.items && listInText && (
          <ol className="steps">
            {s.items.map((it, i) => <li className="step" key={it.title}><b>{i + 1}</b><span>{it.title}{it.text && <small>{it.text}</small>}</span></li>)}
          </ol>
        )}
        {listInText && <Pills items={s.bullets} />}
        <CtaRow ctas={s.ctas} />
      </div>
      {art}
    </section>
  );
}
