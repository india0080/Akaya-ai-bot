import type { Cta } from '../../content/types';
import { Bubble } from '../ui/Bubble';
import { CtaRow } from '../ui/Button';

export function CtaBand({ heading, text, ctas }: { heading: string; text?: string; ctas?: Cta[] }) {
  return (
    <section className="cta" aria-label={heading}>
      <Bubble color="pearl" size={140} />
      <h2>{heading}</h2>
      {text && <p>{text}</p>}
      <CtaRow ctas={ctas} center />
    </section>
  );
}
