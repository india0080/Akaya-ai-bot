// Imported from akaya-voice-flow by scripts/import-voice-flow.mjs. Safe to edit by hand (or from the admin panel later).
import type { PageContent } from '../types';

const agentsShopping: PageContent = {
  "key": "agents-shopping",
  "kind": "agent",
  "path": "/agents/shopping",
  "bubble": "black",
  "seo": {
    "title": "AI Shopping Assistant — Compare Products & Find the Best Deals | Akaya",
    "description": "Akaya Shopping Agent searches supported shopping sources, compares products, prices, ratings, reviews, and specifications to help you find the right product.",
    "keywords": [
      "ai shopping assistant",
      "compare products ai",
      "best deals ai agent"
    ],
    "path": "/agents/shopping",
    "breadcrumbs": [
      {
        "name": "Home",
        "path": "/"
      },
      {
        "name": "Agents",
        "path": "/overview"
      },
      {
        "name": "AI Shopping Assistant",
        "path": "/agents/shopping"
      }
    ]
  },
  "demo": {
    "agent": "Shopping Agent",
    "prompt": "“Find a school bag for my 3-year-old.”",
    "steps": [
      "Understand the need",
      "Search supported retailers",
      "Compare price, ratings and reviews",
      "Recommend the best fit"
    ],
    "result": "Akaya’s Top Picks: Best Value, Premium Choice."
  },
  "hero": {
    "id": "find-better-buy-smarter",
    "heading": "Find better. Buy smarter.",
    "body": [
      "Tell Akaya what you need. It searches supported shopping platforms, compares the options, and recommends the products that best match your needs.",
      "Products shown on this page are demo data. Live results come from configured retailer integrations."
    ],
    "bullets": [
      "Kids Lightweight School Backpack"
    ]
  },
  "sections": [
    {
      "id": "from-find-me-a-to-the-right-product",
      "heading": "From “find me a…” to the right product.",
      "body": [
        "Request, understand, search, compare, evaluate, recommend — one continuous workflow running inside your phone."
      ]
    },
    {
      "id": "let-akaya-compare-before-you-buy",
      "heading": "Let Akaya compare before you buy.",
      "body": [
        "The same Shopping Agent, working across your devices.",
        "Akaya Shopping Agent · demo data, USD pricing"
      ],
      "bullets": [
        "Search: School Bag for 3-Year-Old"
      ]
    },
    {
      "id": "five-steps-no-browsing",
      "heading": "Five steps, no browsing."
    },
    {
      "id": "not-the-most-products-the-right-products",
      "heading": "Not the most products. The right products.",
      "body": [
        "A five-star rating alone never wins. Akaya weighs every signal against what you actually asked for, then explains the ranking in plain language."
      ],
      "bullets": [
        "$54.99 · Best Buy · 2,100 reviews"
      ]
    },
    {
      "id": "retailers-are-sources-not-the-storefront",
      "heading": "Retailers are sources, not the storefront.",
      "body": [
        "Every retailer sits behind a provider adapter that normalizes results into one product shape, so Akaya can add new sources without rebuilding the agent. A retailer only appears in your results when an approved integration is configured."
      ],
      "bullets": [
        "Akaya Shopping Intelligence"
      ]
    },
    {
      "id": "tell-akaya-what-you-need",
      "heading": "Tell Akaya what you need.",
      "body": [
        "Your Shopping Agent searches, compares and explains — you just decide."
      ]
    }
  ]
};

export default agentsShopping;
