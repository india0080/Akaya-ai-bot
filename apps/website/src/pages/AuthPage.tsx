import type { PageContent } from '../content/types';
import { AuthForm, type AuthMode } from '../components/sections/AuthForm';
import { Bubble } from '../components/ui/Bubble';

export function AuthPage({ page }: { page: PageContent }) {
  return (
    <section className="auth">
      <div className="auth-intro">
        <Bubble color="pearl" size={150} eager alt="Akaya bubble" />
        <h1>{page.hero.heading}</h1>
        <p className="lead">{page.hero.body?.[0]}</p>
      </div>
      <div className="auth-island" data-island="auth" data-mode={page.key}>
        <AuthForm mode={page.key as AuthMode} />
      </div>
    </section>
  );
}
