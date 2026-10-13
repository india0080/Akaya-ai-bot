# @akaya/website

The Akaya marketing site, redesigned in the app's design system (`@akaya/ui` tokens: blue `#0269f8`, violet `#7625ef`, cyan `#0dabf4`, green `#08da73`, pearl bubble, light and dark). It replaces the Lovable/TanStack site `akaya-voice-flow`: the URLs and copy are the same, but there is no Lovable dependency, no shadcn and no committed `.env`.

**Stack:** React 19 + TypeScript + Vite 8. It is **prerendered to static HTML** (SSG): every URL is a real HTML file, and only small islands are hydrated.

## Setup
```bash
# from the monorepo root
npm install
cp apps/website/.env.example apps/website/.env.local   # optional
npm run dev   -w @akaya/website     # http://localhost:5173 (client render; use build+serve for real SSG output)
npm run build -w @akaya/website     # dist/ = deployable static site
```

## Scripts
| script | does |
|---|---|
| `dev` | Vite dev server |
| `build` | client build → SSR build → `scripts/prerender.mjs` (HTML per route, sitemap, robots, llms.txt, llms-full.txt, rss.xml, OG images) |
| `preview` | serve `dist/` |
| `lint` / `typecheck` | ESLint (`@akaya/config`) / tsc |
| `blog:new` | scaffold a post (docs/BLOG.md) |
| `seo:lint` | lint blog content |
| `seo:check` | validate the built HTML/JSON-LD/sitemap/robots |
| `indexnow` | ping IndexNow with every sitemap URL |
| `import:voice-flow` | one-off: regenerate `src/content/pages` from the old site's extracted text. This **overwrites hand edits**, including the `demo` blocks on agent pages. |

## Env vars
See `.env.example` and docs/INTEGRATIONS.md:
- `VITE_SITE_URL`
- `VITE_GOOGLE_SITE_VERIFICATION`
- `VITE_BING_SITE_VERIFICATION`
- `VITE_GA4_ID`
- `VITE_GTM_ID`
- `VITE_CLARITY_ID`
- `INDEXNOW_KEY`
- `VITE_API_BASE_URL`

## Folder map
```
apps/website
├─ index.html                 template (<!--head--> / <!--app--> filled by prerender)
├─ public/                    favicon, icons, blog covers (copied as-is)
├─ scripts/                   prerender, blog-new, seo-lint, seo-check, indexnow, import-voice-flow
├─ docs/                      SEO.md, INTEGRATIONS.md, ADMIN-INTEGRATION.md, BLOG.md
└─ src/
   ├─ main.tsx                client islands (theme, consent, auth forms, blog search)
   ├─ entry-server.tsx        SSR render() used by prerender
   ├─ App.tsx, routes.tsx     one route table → page + SEO head
   ├─ pages/                  HomePage, ContentPage (all imported kinds), AuthPage, Blog*, NotFound
   ├─ components/
   │  ├─ layout/              Header, Footer, Layout, ThemeToggle, ConsentBanner
   │  ├─ sections/            Hero, SectionRenderer (+pickVisual), SectionHead, PlanGrid, FaqList, AgentDemo, CtaBand, AuthForm, BlogCard, Pagination
   │  └─ ui/                  Button, Chip, Bubble, PhoneFrame, Breadcrumbs, assets
   ├─ content/                typed content (admin-ready) + blog/*.md
   ├─ seo/                    head.ts, jsonld.ts, integrations.ts
   ├─ services/               auth (AuthService + stub), content (ContentService + local snapshot)
   ├─ config/                 env.ts, site.ts
   ├─ styles/site.css         layout styles on top of @akaya/ui tokens
   └─ assets/img/             WebP bubbles, logo, real app screenshots (light/dark)
```

## Routes (31 prerendered)
- **The 18 content pages from akaya-voice-flow:**
  - Main: `/`, `/overview`, `/about`, `/pricing`, `/faq`, `/support`, `/get-started`, `/app`
  - Agents: `/agents/{shopping,grocery,job-search,finance,phone}`
  - Regions: `/ai-assistant-india`, `/ai-assistant-canada`
  - Legal: `/privacy`, `/terms`, `/refund-policy`
- **New pages:**
  - Auth: `/login`, `/signup`, `/forgot-password` (noindex)
  - Blog: `/blog` (+ category, tag and page routes), `/blog/<slug>`
- **Generated files:** `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, `rss.xml`, `og/*.png`, `404.html`

**Not carried over from the old repo:**
- `/mcp` and `/.well-known/oauth-protected-resource` (Lovable MCP server endpoints) need a server. Re-add them as a serverless function if you still need them.
- The `/app` page's live chat and Web Reader backend (Supabase and LLM server functions) is now a static product page.

## Auth
The forms on `/login`, `/signup` and `/forgot-password` call `authService` (`src/services/auth`). It is a stub that validates input and reports "not connected". To use a real backend, implement the `AuthService` interface with Firebase, Supabase or your API and export it from `src/services/auth/index.ts`.

## Deploy
Static hosting (Vercel, Netlify, Cloudflare Pages or nginx):
- Build command: `npm run build -w @akaya/website`
- Output directory: `apps/website/dist`
- Serve `404.html` for unknown paths.
- URLs use a trailing-slash directory index (`/pricing/` → `pricing/index.html`); the canonicals have no trailing slash.
