# Website consolidation

Akaya currently has three marketing-site codebases. This note compares them **route by route** and recommends a single source of truth. No code was moved.

Checked on 29 October 2026.

| Codebase | Where | What it is |
|---|---|---|
| **apps/website** | `Akaya-ai-bot/apps/website` (this monorepo, package `@akaya/website`) | React 19 + TypeScript + Vite. Prerendered static HTML. Design tokens from `@akaya/ui`. Typed content in `src/content`. |
| **akaya-voice-flow** | [github.com/india0080/akaya-voice-flow](https://github.com/india0080/akaya-voice-flow) | The previous Lovable / TanStack marketing site. **The GitHub repository returns 404** (public and authenticated lookup). Routes below come from the rendered-page snapshot in `apps/website/scripts/voice-flow-pages.json` (18 URLs, canonical host `https://akaya.one`) plus notes in `apps/website/README.md`. |
| **akaya-core-os** | [github.com/india0080/akaya-core-os](https://github.com/india0080/akaya-core-os) (`main`) | A second Lovable marketing site: TanStack Start, React 19, Vite 7, Tailwind 4, shadcn/Radix. File routes in `src/routes`. Positions Akaya as an “offline-first AI operating system”. |

`https://akaya.one` (checked the same day) serves the **apps/website** copy and URL shape: `/`, `/overview`, `/privacy`, `/faq`, `/app`, `/get-started`, `/login`, `/signup`, `/forgot-password`, `/blog` return 200. It does **not** serve core-os paths (`/features`, `/download`, `/privacy-policy` are 404). Several routes that exist in source are also 404 on that host today (`/agents/shopping`, `/agents/grocery`, `/agents/phone`, `/mcp`). Treat that as a deploy gap, not as proof those routes were never built.

## How to read the table

- **Yes** means the codebase has that URL as a real page.
- **Snapshot** means voice-flow no longer has a readable repo; the URL was in the rendered snapshot (canonical on `akaya.one`).
- **README** means voice-flow only: documented as an old server route, not in the snapshot.
- Quality notes are about the implementation, not a visual ranking.

Blog listing routes in apps/website are generated from the two sample posts. With the current posts, prerender emits `/blog`, `/blog/category/guides`, `/blog/tag/offline-ai`, `/blog/tag/privacy`, `/blog/tag/android`, `/blog/tag/india`, `/blog/tag/voice`, `/blog/tag/languages`, `/blog/offline-ai-assistant-guide`, and `/blog/hindi-voice-assistant-india`. Pagination (`/blog/page/2`, and the same under a category or tag) exists in the router but is not emitted until a listing has more than 9 posts.

## Route comparison

| Route | apps/website | akaya-voice-flow | akaya-core-os | Differences / quality | Notes |
|---|---|---|---|---|---|
| `/` | Yes | Snapshot | Yes | All three have a homepage. voice-flow and apps/website share the “More Than Just Chat” story and `akaya.one` canonicals. core-os is a different page (“Offline AI Assistant & AI Operating System”), with a long keyword meta string, relative canonical `/`, and JSON-LD whose `url` is also `/`. apps/website adds hreflang (`en`, `en-US`, `en-IN`, `en-CA`, `x-default`), absolute canonicals from `VITE_SITE_URL`, and Organization / WebSite / SoftwareApplication JSON-LD. The voice-flow snapshot stored an empty keyword string and an empty `ld` array for every page, so structured data was not carried across by the importer. | Live `akaya.one/` matches the apps/website homepage. |
| `/overview` | Yes | Snapshot | No | Long product tour (21 sections in the snapshot). apps/website keeps the copy and renders it through the shared section components, with breadcrumbs and FAQ JSON-LD when FAQs exist. | Live 200. Closest core-os stand-in is `/features`, which immediately redirects to `/features/offline-ai`. |
| `/about` | Yes | Snapshot | Yes | Same path, different stories. voice-flow / apps/website: company behind the assistant. core-os: offline-first OS narrative, its own layout and relative canonical `/about`. | Do not merge the two bodies blindly. Pick one story, then redirect. |
| `/pricing` | Yes | Snapshot | Yes | voice-flow / apps/website: Free, Pro, Pro Plus, Founder lifetime, rendered from `src/content/pricing.ts` with Product JSON-LD. core-os: its own plan grid (title also mentions Lifetime, Family, Enterprise) and relative canonical `/pricing`. | Plan names and prices need one owner before either page is edited again. |
| `/faq` | Yes | Snapshot | No | Snapshot has 8 sections. apps/website turns FAQ content into FAQPage JSON-LD. | Live 200. core-os puts a short accordion on `/` only. |
| `/support` | Yes | Snapshot | No | Help-center copy. apps/website is a static content page. | core-os equivalent is `/contact` (support, business, enterprise). |
| `/get-started` | Yes | Snapshot | No | Thin page in the snapshot (1 section): “Try Akaya”. apps/website keeps it as a content page. | Live 200. core-os sends people to `/download` and `/auth` instead. |
| `/app` | Yes | Snapshot | No | Snapshot title “talk to your AI”, **no canonical** stored. README: the old page’s live chat and Web Reader backends (Supabase and LLM server functions) were not ported. apps/website is a static product page. | Live 200, static. |
| `/agents/shopping` | Yes | Snapshot | No | Dedicated shopping-agent page (7 sections). apps/website can attach an interactive `demo` block; re-running `import:voice-flow` overwrites those hand edits. | **404 on akaya.one** at check time, including the trailing-slash URL. |
| `/agents/grocery` | Yes | Snapshot | No | Same pattern (9 sections). | 404 on akaya.one. |
| `/agents/job-search` | Yes | Snapshot | No | Same pattern (8 sections). | 404 on akaya.one. |
| `/agents/finance` | Yes | Snapshot | No | Same pattern (5 sections). Includes the “not a bank” boundary in the imported copy. | 404 on akaya.one. |
| `/agents/phone` | Yes | Snapshot | No | Longest agent page (13 sections): voice and on-screen phone control. | 404 on akaya.one. |
| `/ai-assistant-india` | Yes | Snapshot | No | Regional landing page. apps/website adds `en-IN` hreflang pointing here from `/`. | Live 200. |
| `/ai-assistant-canada` | Yes | Snapshot | No | Regional landing page. apps/website adds `en-CA` hreflang pointing here from `/`. | Not re-fetched; present in source and the snapshot. |
| `/privacy` | Yes | Snapshot | No | Long policy (33 sections in the snapshot), canonical `https://akaya.one/privacy`. | Live 200. core-os uses `/privacy-policy` instead. |
| `/terms` | Yes | Snapshot | No | Longest legal page in the snapshot (42 sections). | core-os uses `/terms-and-conditions`. |
| `/refund-policy` | Yes | Snapshot | Yes | **Same path in apps/website, voice-flow, and core-os.** Copy and layout differ. core-os uses `legalHead` (canonical `https://akaya-core-os.lovable.app/refund-policy`). apps/website uses the imported akaya.one policy inside the shared content layout. | Two policies on one URL if both sites are ever public. |
| `/login` | Yes | No | No | apps/website only. `noindex`. Form calls the auth stub (“not connected”). | Live 200 (trailing slash). core-os has a single `/auth` placeholder instead of login and signup. |
| `/signup` | Yes | No | No | apps/website only. `noindex`. Stub auth. Copy promises 100 free credits. | Live 200. |
| `/forgot-password` | Yes | No | No | apps/website only. `noindex`. Stub auth. | Live 200. |
| `/blog` | Yes | No | No | Index of markdown posts. Sample posts are flagged `sample: true` and say to replace them before launch. | Live 200. |
| `/blog/offline-ai-assistant-guide` | Yes | No | No | Sample guide. BlogPosting JSON-LD, TOC, FAQ. | |
| `/blog/hindi-voice-assistant-india` | Yes | No | No | Sample guide. | |
| `/blog/category/guides` | Yes | No | No | Both sample posts are category Guides, so this listing is the whole blog. | |
| `/blog/tag/offline-ai` | Yes | No | No | Tag listing. | |
| `/blog/tag/privacy` | Yes | No | No | Tag listing. | |
| `/blog/tag/android` | Yes | No | No | Tag listing. | |
| `/blog/tag/india` | Yes | No | No | Tag listing. | |
| `/blog/tag/voice` | Yes | No | No | Tag listing. | |
| `/blog/tag/languages` | Yes | No | No | Tag listing. | |
| `/blog/page/:n`, `/blog/category/:slug/page/:n`, `/blog/tag/:slug/page/:n` | Router only | No | No | Implemented in `blogListing` / `listRoutes`. Not prerendered until a listing exceeds 9 posts. | |
| `/mcp` | No | README | No | Old Lovable MCP server route. Needs a server. Not in the page snapshot. | 404 on akaya.one. Re-add only if something still calls it. |
| `/.well-known/oauth-protected-resource` | No | README | No | Old OAuth protected-resource metadata. Not in the snapshot. | 404 on akaya.one. |
| `/features` | No | No | Yes | Redirects to `/features/offline-ai`. Sitemap still lists `/features` at priority 0.9, and the route head sets canonical `/features`. | Core-os only. |
| `/features/offline-ai` | No | No | Yes | Real feature page (“Fully offline. Fully yours.”). Covered by the only Playwright spec (`e2e/features-tabs.spec.ts`). Relative canonical. | Overlaps `/offline-ai` and the “two worlds” section on apps/website `/`. |
| `/features/online-ai` | No | No | Yes | Cloud-AI feature page. In the sitemap. Relative canonical. | Overlaps `/online-ai`. |
| `/features/ai-agents` | No | No | Yes | Eight specialist agents (Supervisor, Memory, Phone, Voice, Document, Research, Communication, Finance). In the sitemap. | Not the same as `/agents/{shopping,grocery,job-search,finance,phone}`. |
| `/offline-ai` | No | No | Yes | Second offline-AI page (`src/routes/offline-ai.tsx`, ~296 lines vs ~335 for the features child). **Not in the sitemap.** | Duplicate of `/features/offline-ai`. Drop one when migrating. |
| `/online-ai` | No | No | Yes | Second online-AI page. **Not in the sitemap.** | Duplicate of `/features/online-ai`. |
| `/agents` | No | No | Yes | Third agents URL, same “8 specialist agents” title as `/features/ai-agents`. **Not in the sitemap.** Breadcrumb JSON-LD points at `/features` then `/agents`. | Duplicate. |
| `/download` | No | No | Yes | iOS, Android, desktop download page. In the sitemap. Relative canonical `/download`. | 404 on akaya.one. Worth porting as content; apps/website has no download page. |
| `/contact` | No | No | Yes | Support / business / enterprise / partnerships. In the sitemap. | Closest apps/website page is `/support`. |
| `/auth` | No | No | Yes | Placeholder: heading “Login / Sign Up”, body “Authentication page coming soon.” No form. Still listed in the sitemap at priority 0.4. | apps/website auth pages are real forms, but the service behind them is still a stub. |
| `/affiliate` | No | No | Yes | “Earn 20% Forever” program page. In the sitemap. | No equivalent on the other two sites. The monorepo’s affiliate work (`docs/AFFILIATE.md`) is in-app deep links, not this marketing page. |
| `/affiliate/apply` | No | No | Yes | Application page. **Not in the sitemap.** | |
| `/affiliate-terms` | No | No | Yes | Legal page via `legalHead`. In the sitemap. Canonical on `akaya-core-os.lovable.app`. | |
| `/privacy-policy` | No | No | Yes | Full privacy policy via `legalHead`. Canonical `https://akaya-core-os.lovable.app/privacy-policy`. | Different URL and a different draft from `/privacy`. |
| `/terms-and-conditions` | No | No | Yes | Terms via `legalHead`. Lovable.app canonical. | Different URL from `/terms`. |
| `/cookie-policy` | No | No | Yes | Cookie policy via `legalHead`. Lovable.app canonical. | apps/website mentions cookies inside `/privacy` and has a consent banner; it has no standalone cookie page. |
| `/disclaimer` | No | No | Yes | AI-content disclaimer via `legalHead`. Lovable.app canonical. | No equivalent page on the other sites. |
| `/sitemap.xml` | Generated | Unknown | Yes | apps/website writes it at build time from the route table and **omits noindex** URLs. core-os serves XML from a server handler whose `BASE_URL` is `""`, so every `<loc>` is a path with no host. The core-os sitemap also omits `/offline-ai`, `/online-ai`, `/agents`, and `/affiliate/apply`. | `https://akaya.one/sitemap.xml` returned **500** at check time. |
| 404 | Yes (`NotFoundPage`, `noindex`, prerendered `404.html`) | Unknown | Yes (`NotFoundComponent` on the root route) | Both current codebases have a not-found view. | |

## Quality outside any one route

**apps/website**

- Static HTML per URL, shared header/footer, light and dark, self-hosted fonts, WebP screenshots.
- One route table (`src/routes.tsx`) drives prerender, the document head, and the sitemap.
- No Lovable dependency, no shadcn, no committed `.env` (only `.env.example`).
- Auth, blog search, theme, and the consent banner are small hydrated islands.
- Gaps: auth is a stub, both blog posts are samples, `/app` cannot actually chat, and `import:voice-flow` will overwrite hand-edited agent demos.

**akaya-voice-flow**

- The repo is gone from GitHub, so it cannot be the source of truth even if someone still has a local clone.
- What survived is the copy on `akaya.one` and the 18-page snapshot already imported into apps/website.
- It was the Lovable/TanStack site the redesign was written to replace.

**akaya-core-os**

- Newer product framing (download, offline/online/agents as first-class pages, affiliate, cookie policy, disclaimer, contact) that the other two sites only partly cover.
- SEO problems: empty sitemap host, marketing canonicals that are relative paths, legal canonicals pinned to `https://akaya-core-os.lovable.app`, duplicate agent and offline/online URLs, `/auth` indexed while it has no form, `/features` canonical disagrees with its redirect.
- A `.env` file is committed with Supabase project URL and publishable key. Do not copy that file into this repo.
- Visual system is Tailwind + shadcn + Lucide, not `@akaya/ui`. Shipping it beside the app means two design systems.
- Tests: one Playwright file for the feature tabs. No content-model or SEO check comparable to `seo:lint` / `seo:check`.

## Recommendation

**Source of truth: `Akaya-ai-bot/apps/website`.**

Reasons:

1. **It is the site already on the public domain.** `akaya.one` serves this URL set and this copy. core-os paths 404 there. Changing canonical URLs now would throw away paths the snapshot already marked as `https://akaya.one/...`.
2. **voice-flow cannot be maintained.** The GitHub repo is not available. Its pages already live in `apps/website/src/content`, which is the editable form of that snapshot.
3. **It matches the product.** Tokens, type, and screenshots come from `@akaya/ui` and the app. core-os would stay a second brand system.
4. **It is the better production shape.** Prerendered HTML, one route table, sitemap that knows the host, no committed secrets, no Lovable lock-in. core-os has useful extra topics, but also duplicate URLs, a placeholder auth page in the sitemap, and legal canonicals on `lovable.app`.

core-os is a **content donor**, not the site to keep deploying. voice-flow is an archive.

## Migration outline

Do this in the website content model. Do not import Lovable or shadcn components, and do not copy `akaya-core-os/.env`.

1. **Freeze the other two as references.** Stop deploying akaya-core-os to any host that might be indexed. Do not recreate akaya-voice-flow.
2. **Fix the current host before adding pages.** `akaya.one/sitemap.xml` returned 500, and `/agents/shopping`, `/agents/grocery`, `/agents/job-search`, `/agents/finance`, and `/agents/phone` returned 404 even though `listRoutes()` includes them. Republish `apps/website/dist` and confirm those files exist. Until that is true, the source of truth and the live site disagree.
3. **Keep the akaya.one paths as canonical.** `/privacy`, `/terms`, `/refund-policy`, `/support`, `/overview`, `/get-started`, `/app`, `/agents/*`, `/ai-assistant-india`, `/ai-assistant-canada`.
4. **Write the missing core-os topics as new content pages** (new files under `src/content/pages`, registered like the imported pages). Suggested canonical paths, chosen so they do not collide with the live set:
   - Download → `/download` (no collision).
   - Contact → extend `/support`, or add `/contact` and point both navs at one page.
   - Offline AI, online AI, and the eight-agent overview → new sections on `/overview` (and `/features/offline-ai` only if a dedicated URL is still needed). Do not also create `/offline-ai` and `/online-ai`.
   - Affiliate program, apply, and affiliate terms → only if the marketing program is real. Link the rules to `docs/AFFILIATE.md` so the public page and the in-app program do not diverge. Suggested paths: `/affiliate`, `/affiliate/apply`, `/affiliate-terms`.
   - Cookie policy → `/cookie-policy` if counsel wants a separate page; otherwise keep the privacy section and the consent banner.
   - Disclaimer → a section on `/terms`, or `/disclaimer` if it must be its own URL.
5. **Reconcile legal text offline** (counsel), then publish one privacy policy and one terms set. Source candidates are apps/website `/privacy` and `/terms` (already on akaya.one) versus core-os `/privacy-policy` and `/terms-and-conditions` (dated for a July 2026 draft, canonical on lovable.app). Do not leave both URLs live with different text.
6. **Add redirects** (host config, not a second app) from any core-os URL that was ever public:

   | From | To |
   |---|---|
   | `/privacy-policy` | `/privacy` |
   | `/terms-and-conditions` | `/terms` |
   | `/features`, `/features/offline-ai`, `/offline-ai` | `/overview` (or the new offline section anchor) |
   | `/features/online-ai`, `/online-ai` | `/overview` |
   | `/features/ai-agents`, `/agents` | `/overview` until an `/agents` overview exists; do not point `/agents` at `/agents/phone` |
   | `/auth` | `/login` |
   | `/contact` | `/support` if no `/contact` page is added |

7. **Leave auth on the website, still noindex,** until `AuthService` is a real backend. Do not bring over the core-os “coming soon” page.
8. **Replace the two sample blog posts** before calling `/blog` launch-ready. The route machinery can stay.
9. **Do not restore `/mcp` or `/.well-known/oauth-protected-resource`** unless a client still requests them. If it does, add a small server function. Do not revive the Lovable app to get them back.
10. **After the content lands,** run `npm run build -w @akaya/website` and `npm run seo:check -w @akaya/website`, then submit the new sitemap. Point `site.sameAs` and `VITE_SITE_URL` at the real domain before that build.

No pages were moved as part of this document.
