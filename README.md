# Akaya AI Bot

Monorepo for **Akaya**, a mobile-first AI assistant (PWA prototype), its two standalone commerce agents, the bubble
character system, and the design and marketing assets.

| Folder | What it is | Run |
|---|---|---|
| [`app/`](app/README.md) | Main Akaya app: React 19 + TypeScript + Vite 8 PWA (home, chat, voice, voice notes, translate, future messages, reminders, integrations, agents sheet) | `cd app && npm install && npm run dev` |
| [`agents/shopping-agent/`](agents/shopping-agent/README.md) | Shopping agent: Fastify + zod API and React UI. Hindi/Hinglish search, ranking, compare, price history, watchlist alerts, "Buy on X" links (no checkout) | `npm install && npm run dev` (UI :5174 · API :8787) |
| [`agents/grocery-agent/`](agents/grocery-agent/README.md) | Grocery agent: list parsing, compare across five quick-commerce stores, cheapest/fastest/split baskets, fills the cart, then **notifies you to pay** in the store app (never auto-pays) | `npm install && npm run dev` (UI :5175 · API :8788) |
| [`features/`](features/README.md) | One README per app feature, pointing to its code in `app/` | none (docs only) |
| [`bubble-system/`](bubble-system/README.md) | Akaya bubble character: standalone HTML/JS demo (states, moods, SFX) | open `bubble-system/demo/index.html` |
| [`design/`](design/README.md) | Logo, icons, app screen sheets, UI explorations, bubble designs, sketches, Play Store screens | none (images) |
| [`marketing/`](marketing/README.md) | Final promo and demo videos (each under 50 MB) and their key-frame sheets | none (media) |
| [`docs/`](docs/README.md) | Architecture overview and docs index | none (docs) |

## Quick start

```bash
cd app && npm install && npm run dev                          # http://localhost:5173
cd agents/shopping-agent && npm install && npm run dev        # http://localhost:5174 (API :8787, Swagger /docs)
cd agents/grocery-agent  && npm install && npm run dev        # http://localhost:5175 (API :8788, Swagger /docs)
```

You need Node 20 or later. Each folder is self-contained, with its own `package.json` and lockfile; there is no root
workspace, so you can lift any folder out on its own. The app's **Agents** sheet links to the two agents through
`VITE_SHOPPING_AGENT_URL` and `VITE_GROCERY_AGENT_URL` (defaults are the local ports above).

## Status (honest)

- Everything runs on **Mock providers with sample data**, labelled `SAMPLE` in the UI. No real store, affiliate, LLM or
  integration API is connected. The real adapters are documented skeletons that read `.env`.
- Neither agent pays or places orders. Payment always happens in the store's own app, approved by the user.
- Tests: shopping agent 34, grocery agent 30 (vitest). App: `tsc`, ESLint and `vite build` pass.
- Docker files are written but have not been run (there was no Docker in the build environment).
- See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and each agent's `docs/PROVIDERS.md` for the keys and partnerships
  production needs.

## Repo notes

- Media (about 120 MB of PNG/MP4) is committed directly. If the repo grows, move `marketing/` and `design/` to Git LFS
  (`.gitattributes` has the patterns ready, commented out).
- Never commit `.env` files or `secrets/` (both are git-ignored).
