import type { ContentService, ContentSnapshot } from './types';

export function createContentService(s: ContentSnapshot): ContentService {
  const byPath = new Map(s.pages.map((p) => [p.path, p]));
  const allFaqs = s.pages.flatMap((p) => [p.hero, ...p.sections].flatMap((sec) => sec.faqs ?? []));
  return {
    getPage: (path) => byPath.get(path),
    listPages: () => s.pages,
    getPlans: () => s.plans,
    getNav: () => ({ nav: s.nav, authCtas: s.authCtas, footer: s.footer }),
    listPosts: () => s.posts,
    getPost: (slug) => s.posts.find((p) => p.slug === slug),
    findFaqs: (qs) => qs.map((q) => allFaqs.find((f) => f.q === q)).filter((f) => f !== undefined),
  };
}
