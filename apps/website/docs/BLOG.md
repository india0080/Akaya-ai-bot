# Blog workflow (written for humans and the Akaya AI assistant)

## Write a post
1. Run `npm run blog:new -- "Hindi voice assistant tips" --category Guides --tags india,voice`. This creates `src/content/blog/hindi-voice-assistant-tips.md` with `draft: true`.
2. Fill in the frontmatter:

| field | rule |
|---|---|
| `title` | 30–60 chars, main keyword near the start (becomes the H1 and `<title>` + " \| Akaya Blog") |
| `description` | 70–160 chars, keyword plus benefit (meta description, OG, RSS) |
| `keywords` | 2–6, the first one is the main keyword |
| `slug` | must equal the file name; becomes `/blog/<slug>` |
| `date` / `updated` | `YYYY-MM-DD` (Article JSON-LD, sitemap lastmod, RSS) |
| `author`, `category`, `tags` | category and tag pages are generated automatically |
| `cover` + `coverAlt` | WebP in `public/blog/`; alt text is required |
| `faq` | list of `{q, a}` → FAQ section + FAQPage JSON-LD |
| `canonical` | only for syndicated posts |
| `sample` / `draft` | `sample: true` shows a badge; `draft: true` hides the post |

3. Write the body in Markdown:
   - Do not use `# H1`.
   - Use `##` sections (at least 2) and `###` for subsections. These build the table of contents automatically.
   - Link to at least 2 internal pages, e.g. `/pricing`, `/agents/phone`, `/ai-assistant-india` or other posts.
   - Every image needs alt text.
4. Run `npm run seo:lint`, fix any ✖ errors and review the ⚠ warnings.
5. Set `draft: false`, then run `npm run build && npm run seo:check`.

## What is generated per post
- The page itself: `/blog/<slug>` with the TOC, reading time, related posts (by category and tags), FAQ and tags.
- Structured data: BlogPosting + BreadcrumbList + FAQPage JSON-LD.
- A 1200×630 OG image.
- Listing pages: `/blog`, `/blog/category/<c>` and `/blog/tag/<t>`, paginated at 9 posts per page.
- Feeds and indexes: entries in `rss.xml`, `sitemap.xml`, `llms.txt` and `llms-full.txt`.

## Prompt recipe for the AI assistant
"Write an Akaya blog post for the keyword `<kw>` (secondary: `<kw2>`, `<kw3>`). Audience: `<who>`. 900–1400 words, H2/H3 structure, the keyword in the first 100 words, 3+ internal links from [/overview, /pricing, /agents/*, /ai-assistant-india, /faq, /signup], and 2–4 FAQ entries answering real search questions. Output a complete .md file with frontmatter per docs/BLOG.md. No made-up statistics; mark any claim that needs a source with TODO."

## Publishing from the admin panel later
1. `POST /api/blog/posts` with `{ frontmatter, markdown }`. The server validates it with the same rules as `scripts/seo-lint.mjs`, which you can import or port.
2. Store the post (DB or git commit to `src/content/blog/`).
3. Call `POST /api/deploy`, which runs the build and then `npm run indexnow`.
See ADMIN-INTEGRATION.md for the snapshot API.
