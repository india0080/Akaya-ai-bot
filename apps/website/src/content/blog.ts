/**
 * Blog content: markdown files in ./blog/*.md with YAML frontmatter (see docs/BLOG.md).
 * Parsed at build time (SSG) and on hydration; the admin panel can later supply the same BlogPost shape via API.
 */
import { parse as parseYaml } from 'yaml';
import { marked } from 'marked';
import type { Faq } from './types';

export interface BlogFrontmatter {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
  date: string;
  updated?: string;
  author: string;
  category: string;
  tags: string[];
  cover?: string;
  coverAlt?: string;
  faq?: Faq[];
  canonical?: string;
  sample?: boolean;
  draft?: boolean;
}
export interface TocEntry { id: string; text: string; level: 2 | 3 }
export interface BlogPost extends BlogFrontmatter {
  html: string;
  toc: TocEntry[];
  readingMinutes: number;
  words: number;
}

export const POSTS_PER_PAGE = 9;
export const slugify = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const fmtDate = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

export function parsePost(raw: string): BlogPost {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error('Blog post is missing frontmatter');
  const fm = parseYaml(m[1]) as BlogFrontmatter;
  const body = m[2];
  const toc: TocEntry[] = [];
  const renderer = new marked.Renderer();
  renderer.heading = ({ tokens, depth }) => {
    const text = marked.Parser.parseInline(tokens);
    const id = slugify(text);
    if (depth === 2 || depth === 3) toc.push({ id, text: text.replace(/<[^>]+>/g, ''), level: depth });
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };
  renderer.image = ({ href, text }) => `<img src="${href}" alt="${text}" loading="lazy" decoding="async">`;
  const html = marked.parse(body, { renderer, async: false }) as string;
  const words = body.split(/\s+/).filter(Boolean).length;
  return { ...fm, tags: fm.tags ?? [], keywords: fm.keywords ?? [], html, toc, words, readingMinutes: Math.max(1, Math.round(words / 220)) };
}

const files = import.meta.glob('./blog/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const posts: BlogPost[] = Object.values(files)
  .map(parsePost)
  .filter((p) => !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date));

export const categories = [...new Set(posts.map((p) => p.category))].sort();
export const tags = [...new Set(posts.flatMap((p) => p.tags))].sort();

export function relatedPosts(post: BlogPost, n = 3): BlogPost[] {
  const score = (p: BlogPost) => (p.category === post.category ? 2 : 0) + p.tags.filter((t) => post.tags.includes(t)).length;
  return posts.filter((p) => p.slug !== post.slug).sort((a, b) => score(b) - score(a)).slice(0, n);
}
