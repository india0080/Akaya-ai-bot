/**
 * Content model for every page. This is the contract the admin panel / CMS must return
 * (see docs/ADMIN-INTEGRATION.md). Components never hard-code copy; they render these types.
 */
export type BubbleColor = 'blue' | 'violet' | 'cyan' | 'green' | 'orange' | 'pearl' | 'cream' | 'black';
export type PageKind = 'home' | 'generic' | 'legal' | 'agent' | 'region' | 'faq' | 'pricing' | 'auth' | 'blog';

export interface Crumb { name: string; path: string }
export interface SeoMeta {
  title: string;
  description: string;
  keywords: string[];
  path: string;
  ogImage?: string;
  noindex?: boolean;
  /** hreflang → path, e.g. { 'en-IN': '/ai-assistant-india' } */
  hreflang?: Record<string, string>;
  breadcrumbs?: Crumb[];
}
export interface Item { title: string; text?: string; bubble?: BubbleColor }
export interface Faq { q: string; a: string }
export interface Section {
  id: string;
  heading: string;
  eyebrow?: string;
  body?: string[];
  items?: Item[];
  faqs?: Faq[];
  bullets?: string[];
  /** Visual treatment; omitted = chosen automatically from the data shape. */
  visual?: SectionVisual;
  /** App screenshot keys (src/assets/img/<theme>-<key>.webp) for phone visuals. */
  screens?: string[];
  bubble?: BubbleColor;
  ctas?: Cta[];
}
export type SectionVisual = 'split-phones' | 'gradient-pair' | 'gradient-grid' | 'skills' | 'chips' | 'card-list' | 'cards' | 'apps' | 'faq' | 'prose' | 'steps';
export interface Cta { label: string; href: string; primary?: boolean }
export interface PageContent {
  key: string;
  kind: PageKind;
  path: string;
  bubble?: BubbleColor;
  seo: SeoMeta;
  hero: Section;
  sections: Section[];
  ctas?: Cta[];
  /** Agent pages: data for the shared AgentDemo phone. */
  demo?: AgentDemo;
}
export interface AgentDemo { agent: string; prompt: string; steps: string[]; result: string }
export interface Plan {
  id: string;
  name: string;
  monthly: string;
  yearly?: string;
  suffix?: string;
  credits: string;
  features: string[];
  cta: Cta;
  highlight?: boolean;
}
export interface NavLink { label: string; href: string }
export interface FooterColumn { title: string; links: NavLink[] }
