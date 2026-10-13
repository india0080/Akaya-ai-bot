/** Single route table for SSR prerender and client hydration. URL → page element + SEO head. */
import type { ReactNode } from 'react';
import { categories, tags, posts, POSTS_PER_PAGE, slugify as slug } from './content/blog';
import { blogListing, postCrumbs } from './content/blogRoutes';
import { homeFaqIds } from './content/home';
import type { PageContent } from './content/types';
import { content } from './services/content';
import type { HeadInput } from './seo/head';
import * as ld from './seo/jsonld';
import { AuthPage } from './pages/AuthPage';
import { BlogIndexPage } from './pages/BlogIndexPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { ContentPage } from './pages/ContentPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

export interface ResolvedRoute { element: ReactNode; head: HeadInput; status: 200 | 404 }

export const ogPath = (path: string) => `/og/${path === '/' ? 'home' : path.slice(1).replace(/\//g, '-')}.png`;
export const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p) || '/';

function pageFaqs(p: PageContent) {
  if (p.kind === 'home') return content.findFaqs(homeFaqIds);
  return [p.hero, ...p.sections].flatMap((s) => s.faqs ?? []);
}

function pageHead(p: PageContent): HeadInput {
  const faqs = pageFaqs(p);
  const plans = content.getPlans();
  const jsonLd: ld.JsonLd[] = [ld.organization()];
  if (p.kind === 'home') jsonLd.push(ld.website(), ld.softwareApp(p, plans));
  if (p.kind === 'agent' || p.kind === 'region') jsonLd.push(ld.softwareApp(p, plans));
  if (p.kind === 'pricing') jsonLd.push(ld.product(plans));
  if (faqs.length) jsonLd.push(ld.faqPage(faqs));
  if (p.seo.breadcrumbs) jsonLd.push(ld.breadcrumbs(p.seo.breadcrumbs));
  return { ...p.seo, ogImage: p.seo.ogImage ?? ogPath(p.path), jsonLd };
}

export function resolveRoute(rawPath: string): ResolvedRoute {
  const path = normalize(rawPath);
  const page = content.getPage(path);
  if (page) {
    const element = page.kind === 'home' ? <HomePage /> : page.kind === 'auth' ? <AuthPage page={page} /> : <ContentPage page={page} />;
    return { element, head: pageHead(page), status: 200 };
  }
  const post = path.startsWith('/blog/') ? content.getPost(path.slice(6)) : undefined;
  if (post) {
    const ogImage = ogPath(path);
    const jsonLd = [ld.organization(), ld.article(post, ogImage), ld.breadcrumbs(postCrumbs(post)), ...(post.faq?.length ? [ld.faqPage(post.faq)] : [])];
    return {
      element: <BlogPostPage post={post} />, status: 200,
      head: { title: `${post.title} | Akaya Blog`, description: post.description, keywords: post.keywords, path, canonical: post.canonical, ogImage, ogType: 'article', published: post.date, jsonLd },
    };
  }
  const listing = blogListing(path);
  if (listing) {
    return {
      element: <BlogIndexPage listing={listing} />, status: 200,
      head: { title: listing.page > 1 ? `${listing.title} – Page ${listing.page}` : listing.title, description: listing.intro, keywords: ['akaya blog', 'ai assistant guides'], path, ogImage: ogPath('/blog'), jsonLd: [ld.organization(), ld.breadcrumbs(listing.crumbs)] },
    };
  }
  return { element: <NotFoundPage />, status: 404, head: { title: 'Page not found | Akaya', description: 'This page does not exist.', keywords: [], path, ogImage: ogPath('/'), noindex: true, jsonLd: [] } };
}

/** Every URL to prerender (and, minus noindex ones, to list in the sitemap). */
export function listRoutes(): string[] {
  const pages = content.listPages().map((p) => p.path);
  const listingPages = (base: string, n: number) => Array.from({ length: Math.max(1, Math.ceil(n / POSTS_PER_PAGE)) }, (_, i) => (i ? `${base}/page/${i + 1}` : base));
  return [
    ...pages,
    ...listingPages('/blog', posts.length),
    ...categories.flatMap((c) => listingPages(`/blog/category/${slug(c)}`, posts.filter((p) => p.category === c).length)),
    ...tags.flatMap((t) => listingPages(`/blog/tag/${slug(t)}`, posts.filter((p) => p.tags.includes(t)).length)),
    ...posts.map((p) => `/blog/${p.slug}`),
  ];
}
