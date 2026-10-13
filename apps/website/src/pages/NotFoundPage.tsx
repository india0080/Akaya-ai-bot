import { CtaRow } from '../components/ui/Button';
import { Bubble } from '../components/ui/Bubble';

export function NotFoundPage() {
  return (
    <section className="auth-intro center nf">
      <Bubble color="pearl" size={160} eager />
      <h1>Page not found</h1>
      <p className="lead">This page moved or never existed.</p>
      <CtaRow ctas={[{ label: 'Go home', href: '/', primary: true }, { label: 'Blog', href: '/blog' }]} center />
    </section>
  );
}
