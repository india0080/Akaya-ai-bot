/** URL helpers for blog listings (index, category, tag, pagination) and post breadcrumbs. */
import { categories, posts as allPosts, slugify as slug, tags, POSTS_PER_PAGE, type BlogPost } from './blog';
import type { Crumb } from './types';

export interface BlogListing { title: string; intro: string; base: string; page: number; pages: number; posts: BlogPost[]; crumbs: Crumb[] }

export function blogListing(path: string): BlogListing | undefined {
  const m = /^\/blog(?:\/(category|tag)\/([^/]+))?(?:\/page\/(\d+))?$/.exec(path);
  if (!m) return undefined;
  const [, kind, value, n] = m;
  const page = Number(n ?? 1);
  let list = allPosts;
  let title = 'Akaya Blog';
  let intro = 'Guides, tips and news about AI assistants, voice AI and offline AI.';
  const crumbs: Crumb[] = [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }];
  let base = '/blog';
  if (kind) {
    const label = (kind === 'category' ? categories : tags).find((c) => slug(c) === value);
    if (!label) return undefined;
    list = allPosts.filter((p) => (kind === 'category' ? p.category === label : p.tags.includes(label)));
    title = kind === 'category' ? `${label} — Akaya Blog` : `#${label} — Akaya Blog`;
    intro = `Posts ${kind === 'category' ? 'in' : 'tagged'} ${label}.`;
    base = `/blog/${kind}/${value}`;
    crumbs.push({ name: label, path: base });
  }
  const pages = Math.max(1, Math.ceil(list.length / POSTS_PER_PAGE));
  if (page > pages) return undefined;
  return { title, intro, base, page, pages, crumbs, posts: list.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE) };
}

export const postCrumbs = (p: BlogPost) => [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: p.category, path: `/blog/category/${slug(p.category)}` }, { name: p.title, path: `/blog/${p.slug}` }];
