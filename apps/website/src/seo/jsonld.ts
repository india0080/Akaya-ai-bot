/** schema.org JSON-LD builders. All URLs absolute; one Organization @id shared by every node. */
import { config } from '../config/env';
import { site } from '../config/site';
import type { BlogPost } from '../content/blog';
import type { Crumb, Faq, PageContent, Plan } from '../content/types';

export type JsonLd = Record<string, unknown>;
export const abs = (path: string) => (path.startsWith('http') ? path : config.siteUrl + path);
const ORG_ID = () => abs('/#organization');
const SITE_ID = () => abs('/#website');

export const organization = (): JsonLd => ({
  '@context': 'https://schema.org', '@type': 'Organization', '@id': ORG_ID(),
  name: site.name, alternateName: site.alternateName, url: abs('/'), logo: abs(site.logoPath), slogan: site.slogan,
  description: site.description, ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
});

export const website = (): JsonLd => ({
  '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE_ID(), url: abs('/'), name: site.name, publisher: { '@id': ORG_ID() },
  potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: abs('/blog?q={search_term_string}') }, 'query-input': 'required name=search_term_string' },
});

export const softwareApp = (p: PageContent, plans: Plan[]): JsonLd => ({
  '@context': 'https://schema.org', '@type': ['SoftwareApplication', 'MobileApplication'], name: site.name, url: abs(p.path),
  description: p.seo.description, applicationCategory: 'ProductivityApplication', operatingSystem: 'Android, iOS, Windows, Web',
  publisher: { '@id': ORG_ID() },
  offers: plans.map((pl) => offer(pl)),
});

const priceNum = (s: string) => s.replace(/[^0-9.]/g, '') || '0';
const offer = (pl: Plan): JsonLd => ({ '@type': 'Offer', name: pl.name, price: priceNum(pl.monthly), priceCurrency: 'USD', url: abs('/pricing'), availability: 'https://schema.org/InStock' });

export const product = (plans: Plan[]): JsonLd => ({
  '@context': 'https://schema.org', '@type': 'Product', name: 'Akaya AI Assistant', brand: { '@id': ORG_ID() },
  description: 'Akaya plans: Free, Pro, Pro Plus and Founder 1000 Lifetime.', image: abs(site.logoPath),
  offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: '0', highPrice: priceNum(plans.at(-1)?.monthly ?? '0'), offerCount: plans.length, offers: plans.map(offer) },
});

export const breadcrumbs = (items: Crumb[]): JsonLd => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
});

export const faqPage = (faqs: Faq[]): JsonLd => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

export const article = (p: BlogPost, ogImage: string): JsonLd => ({
  '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description,
  datePublished: p.date, dateModified: p.updated ?? p.date, author: { '@type': 'Person', name: p.author },
  publisher: { '@id': ORG_ID() }, image: abs(ogImage), mainEntityOfPage: abs(`/blog/${p.slug}`),
  keywords: p.keywords.join(', '), articleSection: p.category, wordCount: p.words,
});
