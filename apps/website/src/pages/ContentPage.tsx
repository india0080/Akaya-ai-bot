import type { PageContent } from '../content/types';
import { planSectionIds } from '../content/pricing';
import { content } from '../services/content';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { AgentDemo } from '../components/sections/AgentDemo';
import { CtaBand } from '../components/sections/CtaBand';
import { Hero } from '../components/sections/Hero';
import { PlanGrid } from '../components/sections/PlanGrid';
import { SectionRenderer } from '../components/sections/SectionRenderer';

const SIGNUP = [{ label: 'Sign up free', href: '/signup', primary: true }, { label: 'Log in', href: '/login' }];

/** Renders every imported page kind (generic, agent, region, faq, pricing, legal) from content. */
export function ContentPage({ page }: { page: PageContent }) {
  const legal = page.kind === 'legal';
  const sections = page.kind === 'pricing' ? page.sections.filter((s) => !planSectionIds.includes(s.id)) : page.sections;
  const last = sections.at(-1);
  const closing = !legal && last && !last.faqs && !last.items ? last : undefined;
  const body = closing ? sections.slice(0, -1) : sections;
  return (
    <>
      <Breadcrumbs items={page.seo.breadcrumbs} />
      <Hero s={{ ...page.hero, ctas: page.hero.ctas ?? (legal ? undefined : SIGNUP) }} bubble={page.bubble} />
      {page.demo && (
        <section className="split" aria-label={`${page.demo.agent} demo`}>
          <div className="head left"><h2>See the {page.demo.agent} at work</h2><p>{page.demo.prompt}</p></div>
          <AgentDemo demo={page.demo} />
        </section>
      )}
      {page.kind === 'pricing' && <section id="plans"><PlanGrid plans={content.getPlans()} /></section>}
      {body.map((s, i) => <SectionRenderer key={s.id + i} s={s} index={i} legal={legal} />)}
      {closing && <CtaBand heading={closing.heading} text={closing.body?.[0]} ctas={closing.ctas ?? SIGNUP} />}
    </>
  );
}
