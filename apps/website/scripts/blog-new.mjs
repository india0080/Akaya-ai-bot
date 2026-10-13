/**
 * Scaffold a blog post:  npm run blog:new -- "Post title" [--category Guides] [--tags a,b] [--author "Akaya Team"]
 * Creates src/content/blog/<slug>.md with full frontmatter for the SEO lint to check.
 */
import fs from 'node:fs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const title = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!title) { console.error('Usage: npm run blog:new -- "Post title" [--category Guides] [--tags a,b]'); process.exit(1); }
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const file = new URL(`../src/content/blog/${slug}.md`, import.meta.url);
if (fs.existsSync(file)) { console.error(`Exists: ${slug}.md`); process.exit(1); }
const tags = (opt('tags', '') || '').split(',').filter(Boolean);
fs.writeFileSync(file, `---
title: "${title.replace(/"/g, '\\"')}"
description: "TODO: 120-160 character summary with the main keyword."
keywords: [TODO main keyword, TODO secondary keyword]
slug: ${slug}
date: ${new Date().toISOString().slice(0, 10)}
author: ${opt('author', 'Akaya Team')}
category: ${opt('category', 'Guides')}
tags: [${tags.join(', ')}]
cover: /blog/${slug}-cover.webp
coverAlt: TODO describe the cover image
draft: true
faq:
  - q: TODO question people search for?
    a: TODO short direct answer.
---

Intro paragraph that uses the main keyword in the first 100 words and links to [a product page](/overview).

## First section

## Second section

### Detail

## Conclusion

[Sign up free](/signup).
`);
console.log(`Created src/content/blog/${slug}.md (draft: true — set to false to publish).`);
