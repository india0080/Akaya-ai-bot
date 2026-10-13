# Admin panel / CMS integration

All copy, SEO meta, pricing, navigation and blog posts render from one typed **ContentSnapshot** (`src/services/content/types.ts`). Components never hard-code copy.

```
src/content/types.ts           PageContent, Section, Plan, Faq, SeoMeta, AgentDemo, NavLink …
src/content/home.ts            home page
src/content/pages/*.ts         17 pages imported from akaya-voice-flow
src/content/auth.ts            /login /signup /forgot-password
src/content/pricing.ts         plans
src/content/site.ts            nav, auth CTAs, footer
src/content/blog/*.md          blog posts (frontmatter + markdown)
src/services/content/          ContentService interface + local snapshot
```

## Swapping local files for an API
The site is static (SSG), so content is fetched **at build time**. Publishing from the admin panel then triggers a rebuild through a deploy hook (Vercel, Netlify or Cloudflare Pages).

1. Implement `fetchSnapshot(): Promise<ContentSnapshot>` that calls the API below.
2. In `src/services/content/index.ts`, build the service from that snapshot. Use top-level await in the SSR entry, or have `scripts/prerender.mjs` write the snapshot to `src/content/.snapshot.json` before `vite build`.
3. The admin panel calls the deploy hook after it saves. A typical rebuild takes about 10 s.

## Suggested API
| Method | Endpoint | Body / response |
|---|---|---|
| GET | `/api/content/snapshot` | `ContentSnapshot` (everything, for the build) |
| GET/PUT | `/api/content/pages/:key` | `PageContent` |
| GET/PUT | `/api/content/plans` | `Plan[]` |
| GET/PUT | `/api/content/navigation` | `{ nav: NavLink[], authCtas: Cta[], footer: FooterColumn[] }` |
| GET/POST | `/api/blog/posts` | list / create `BlogPostInput` |
| GET/PUT/DELETE | `/api/blog/posts/:slug` | `BlogPostInput` |
| POST | `/api/deploy` | triggers the static rebuild |

```ts
// Key types (full definitions in src/content/types.ts)
interface SeoMeta { title: string; description: string; keywords: string[]; path: string; ogImage?: string; noindex?: boolean; hreflang?: Record<string, string>; breadcrumbs?: { name: string; path: string }[] }
interface Section { id: string; heading: string; eyebrow?: string; body?: string[]; items?: { title: string; text?: string; bubble?: BubbleColor }[]; faqs?: { q: string; a: string }[]; bullets?: string[]; visual?: SectionVisual; screens?: string[]; bubble?: BubbleColor; ctas?: Cta[] }
interface PageContent { key: string; kind: PageKind; path: string; bubble?: BubbleColor; seo: SeoMeta; hero: Section; sections: Section[]; ctas?: Cta[]; demo?: { agent: string; prompt: string; steps: string[]; result: string } }
interface Plan { id: string; name: string; monthly: string; yearly?: string; suffix?: string; credits: string; features: string[]; cta: Cta; highlight?: boolean }
interface BlogPostInput { frontmatter: BlogFrontmatter; markdown: string }   // see src/content/blog.ts
```

Validation:
- Mirror these types with zod on the API side.
- `visual` is optional. If it is omitted, `pickVisual()` picks a layout from the data shape: faqs → accordion, items with text → bubble cards, step items → numbered list, otherwise split + bubble.
- New pages need no code: add a `PageContent` with a new `path` and it is routed, prerendered, put in the sitemap and in llms.txt automatically.

Auth is separate: `src/services/auth` (the `AuthService` interface, currently a stub).
