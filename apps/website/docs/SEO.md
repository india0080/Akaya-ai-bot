# SEO

## What the build produces
| Item | Where |
|---|---|
| Static HTML per URL (crawlable without JS) | `dist/**/index.html` (scripts/prerender.mjs) |
| Title, description, keywords, robots, canonical | `src/seo/head.ts`, values from `src/content/**` |
| Open Graph + Twitter `summary_large_image` | same; 1200×630 PNG per page in `dist/og/` |
| hreflang `en`, `en-US`, `en-IN`, `en-CA`, `x-default` | home, `/ai-assistant-india`, `/ai-assistant-canada`. No Hindi (`hi`) pages exist yet; add `hi` once a Hindi page ships. |
| JSON-LD | `src/seo/jsonld.ts`: Organization (one `@id`), WebSite + SearchAction (`/blog?q=`), SoftwareApplication + MobileApplication with Offers, Product + AggregateOffer (pricing), FAQPage (any page with FAQs + home + posts), BreadcrumbList, BlogPosting |
| sitemap.xml | auto from the route table (noindex pages excluded) |
| robots.txt | allows Googlebot, Bingbot, Applebot(-Extended), Google-Extended, GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot (+ Claude-User/SearchBot), CCBot, DuckDuckBot, YandexBot; blocks auth pages |
| llms.txt / llms-full.txt | index of pages/posts + full plain text for AI search |
| rss.xml | blog feed |

Core Web Vitals:
- Pages are static, and only the interactive islands load JS: the theme toggle, the consent banner, the auth forms and the blog search. That is about 225 kB of JS, mostly React DOM, and roughly 70 kB gzipped.
- All images are WebP with width/height set. They lazy-load below the fold, and the hero image uses `fetchpriority=high`.
- Fonts are self-hosted (`@fontsource`), and the 3 above-the-fold files are preloaded.
- The theme is set by an inline script before first paint, so there is no flash.

## Checks
- `npm run seo:lint`: blog/content rules (lengths, headings, alt, internal links).
- `npm run build && npm run seo:check`: checks the built HTML. It confirms every JSON-LD block parses, there is one H1 per page, and the meta, canonical, og:image and img alt attributes are present. It also checks the sitemap count, the robots bots list, and that llms.txt and rss.xml exist.

## Keyword list (starting point)
These come from competitor and ASO research (Indus, Kruti, Hindi speech-to-text apps; Google's AI Mode and Search Live launch in Hindi plus 7 Indian languages). Check volumes in Google Keyword Planner or Search Console before committing.

### Core (global)
ai assistant app · personal ai assistant · ai assistant for android · voice ai assistant · ai voice assistant app · ai chat assistant · offline ai assistant · on-device ai · ai without internet · private ai assistant · floating ai assistant · ai assistant over apps · ai pdf reader · chat with pdf · ai document summarizer · ai translator app · ai translation 99 languages · ai smart reply · ai reminder app · ai voice notes · ai image generator app · ai web reader / summarize website

### India
ai assistant app india · best ai assistant in india · hindi voice assistant · ai assistant in hindi · hinglish ai chatbot · hindi speech to text offline · speech to text hindi app · voice typing hindi · hindi english translation app · ai assistant bengali / marathi / tamil / telugu / kannada / malayalam / gujarati / punjabi · made in india ai assistant · whatsapp ai reply hindi

### Canada / US
ai assistant canada · voice ai assistant canada · french english ai assistant · ai assistant app usa · ai personal assistant for work

### Agents (long-tail, high intent)
ai shopping assistant · compare products ai · best deals ai agent · ai grocery list app · ai job search assistant · ai job finder · ai finance assistant · ai expense tracker · phone ai agent android · ai that controls your phone

### Pricing / commercial
ai assistant lifetime deal · ai assistant subscription price · cheap gpt claude gemini in one app · multiple ai models one app

### Blog topic ideas
offline vs online ai · how to use ai in hindi · best ai apps for students india · summarize pdf with ai on phone · ai reply on whatsapp · is on-device ai private · ai trip planner india

## Before launch
- Set `VITE_SITE_URL` to the real domain. Canonicals, OG URLs and the sitemap all use it.
- Fill `site.sameAs` in `src/config/site.ts` with the official social and Play Store URLs, for the knowledge panel.
- Replace the 2 **sample** blog posts.
- Submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools, and run `npm run indexnow`.
