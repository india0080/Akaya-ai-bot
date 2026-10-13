import type { BlogPost } from '../../content/blog';
import type { Faq, FooterColumn, NavLink, Cta, PageContent, Plan } from '../../content/types';

/**
 * Everything the site renders comes from a ContentSnapshot. Locally it is built from src/content;
 * an admin panel/CMS adapter only has to return the same shape (fetched at build time for SSG).
 */
export interface ContentSnapshot {
  pages: PageContent[];
  plans: Plan[];
  nav: NavLink[];
  authCtas: Cta[];
  footer: FooterColumn[];
  posts: BlogPost[];
}

export interface ContentService {
  getPage(path: string): PageContent | undefined;
  listPages(): PageContent[];
  getPlans(): Plan[];
  getNav(): { nav: NavLink[]; authCtas: Cta[]; footer: FooterColumn[] };
  listPosts(): BlogPost[];
  getPost(slug: string): BlogPost | undefined;
  /** All FAQ entries across pages (for FAQPage JSON-LD and teasers). */
  findFaqs(questions: string[]): Faq[];
}
