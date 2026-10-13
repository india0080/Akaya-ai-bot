import home, { homeClosing, homeFaqIds } from '../content/home';
import { content } from '../services/content';
import { ButtonLink } from '../components/ui/Button';
import { Eyebrow } from '../components/ui/Chip';
import { CtaBand } from '../components/sections/CtaBand';
import { FaqList } from '../components/sections/FaqList';
import { Hero } from '../components/sections/Hero';
import { PlanGrid } from '../components/sections/PlanGrid';
import { SectionRenderer } from '../components/sections/SectionRenderer';

export function HomePage() {
  const [tagline, ...body] = home.hero.body ?? [];
  return (
    <>
      <Hero s={{ ...home.hero, body }} tagline={tagline} floats />
      {home.sections.map((s, i) => <SectionRenderer key={s.id} s={s} index={i} />)}
      <section id="pricing">
        <div className="head"><Eyebrow>Pricing</Eyebrow><h2>Pick the plan that fits you.</h2><p>Start free, go monthly or yearly, or own Akaya for life with Founder 1000.</p></div>
        <PlanGrid plans={content.getPlans()} compact />
        <p className="center mt"><ButtonLink label="See full pricing →" href="/pricing" /></p>
      </section>
      <section id="faq" className="narrow">
        <div className="head"><h2>Questions? Answered.</h2></div>
        <FaqList faqs={content.findFaqs(homeFaqIds)} />
        <p className="center mt"><ButtonLink label="All questions →" href="/faq" /></p>
      </section>
      <CtaBand heading={homeClosing.heading} text={homeClosing.text} ctas={home.ctas} />
      <p className="entity muted small">{homeClosing.entity}</p>
    </>
  );
}
