import type { Cta } from '../../content/types';

interface Props extends Cta { size?: 'sm' | 'md'; className?: string }

export function ButtonLink({ label, href, primary, size = 'md', className = '' }: Props) {
  return (
    <a className={`btn${primary ? ' primary' : ''}${size === 'sm' ? ' sm' : ''} ${className}`.trim()} href={href}>
      {label}
    </a>
  );
}

export function CtaRow({ ctas, center }: { ctas?: Cta[]; center?: boolean }) {
  if (!ctas?.length) return null;
  return (
    <div className={`ctas${center ? ' center' : ''}`}>
      {ctas.map((c) => <ButtonLink key={c.href + c.label} {...c} />)}
    </div>
  );
}
