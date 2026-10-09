# Akaya Grocery Agent

Type or speak a grocery list in English, हिन्दी or Hinglish (`2 kg aata, 1 L Amul milk, 6 eggs`). The agent compares
**Swiggy Instamart, Blinkit, Zepto, BigBasket and Amazon Fresh** with fees included, builds the **cheapest, fastest or
split** basket, fills the cart, and then **notifies you to confirm and pay**.

> **Akaya never pays.** It stops at a filled cart. You pay in the store app with UPI, card or wallet and approve the
> OTP / UPI PIN yourself (RBI's additional-factor authentication). There is no auto-pay option, including for scheduled lists.

> **Sample data.** Out of the box every store runs on the **Mock provider**: a realistic INR catalogue, fees, slots and
> ETAs that are **not live store data**. The UI and API label it (`SAMPLE`, `sample: true`). Real adapters are skeletons
> (see [docs/PROVIDERS.md](docs/PROVIDERS.md)); none has been run against a live store.

| | |
|---|---|
| UI | React 19 + TypeScript + Vite, Akaya design (pearl, brand gradients, Comfortaa/Manrope, light + dark, phone layout, Akaya nav) |
| API | Node 20 + TypeScript + Fastify 5, zod validation, OpenAPI 3 + Swagger UI at `/docs` |
| Engine | list parser (EN/HI/Hinglish, number words, units, brands, variants) · basket optimizer (pack combos, substitutions, fees, split) |
| Infra | TTL cache · rate limiting · in-process job queue with SSE progress · JSON-file store · notification service (in-app SSE + Web Push/FCM stub) |

## Quick start (Mock providers, no keys)

```bash
cd grocery-agent
npm install          # also installs backend/ and frontend/
npm run dev          # API http://localhost:8788 (docs at /docs) · UI http://localhost:5175
```

Or with Docker: `docker compose up --build` (same ports). *The compose file was written but not run in our build environment, which had no Docker.*

Tests: `npm test` (backend unit + API tests) · lint: `npm run lint` · build: `npm run build` · OpenAPI file: `npm run openapi` → `docs/openapi.json`.

## What's inside

```
grocery-agent/
├─ backend/
│  ├─ src/
│  │  ├─ engine/listParser.ts      # "aadha kilo pyaz aur ek darjan ande" → items with qty/unit/brand/variant
│  │  ├─ engine/optimizer.ts       # pack combos, substitutions, fees, cheapest/fastest/split/balanced plans, budget tips
│  │  ├─ providers/types.ts        # GroceryProvider interface (no pay/checkout method by design)
│  │  ├─ providers/mock.ts         # Mock stores: sample catalogue, fee rules, IST slots, simulated cart fill
│  │  ├─ providers/catalog.ts      # ~38 items with Hindi/Hinglish words, brands, pack sizes, substitutes
│  │  ├─ providers/mcp/base.ts     # official Instamart / Zepto MCP adapter skeleton (search + cart tools only)
│  │  ├─ providers/playwright/*    # own-session browser adapters per store (skeleton, TODO selectors)
│  │  ├─ providers/registry.ts     # picks MCP → Playwright → Mock per store
│  │  ├─ services/quotes.ts        # quote job: ask every store in parallel, stream progress, optimize
│  │  ├─ services/checkout.ts      # fill carts → "ready to pay" → hand-off → user-confirmed paid → tracking
│  │  ├─ services/lists.ts         # saved lists, budgets, weekly schedules (IST), settings
│  │  └─ routes/index.ts           # REST API (zod schemas → OpenAPI)
│  └─ test/                        # vitest: parser, optimizer, schedule, providers, API flows
├─ frontend/src/
│  ├─ screens/  Home · Items · Compare · Basket · Checkout · Order · Lists · Orders · Settings
│  └─ components/  ListSheet · StoreSheet · SubSheet · HandoffSheet · FeeTable · NotifBanner
│     (UI kit, VoiceSheet and HeadsUp come from @akaya/ui; cache, queue, notifications and the JSON store from @akaya/server-kit)
├─ docs/  ARCHITECTURE.md · API.md · PROVIDERS.md · openapi.json
├─ docker-compose.yml · .env.example · package.json · npm run dev (scripts/agent-dev.mjs at the repo root)
```

## Features

- **List input:** text or voice (Web Speech API, `en-IN` / `hi-IN`; "Demo phrases" simulate voice where no mic is available).
  Understands `aadha kilo`, `dedh litre`, `ek darjan`, `1/2 kg`, Devanagari (`दो किलो आटा`), brands (`Amul`, `Aashirvaad`)
  and variants (`sarson ka tel` → mustard oil). Unknown items are listed, not guessed.
- **Edit parsed items:** quantity steppers, remove, add more, budget limit, save as a list.
- **Compare:** live per-store progress (SSE), every store's total with delivery, handling, small-cart and platform fees,
  ETA or slot, missing items and substitutions.
- **Plans:** *Best overall* (price + time + hassle), *Cheapest single store*, *Fastest*, and *Split* across 2–3 stores, offered
  only when it saves at least ₹20 after the extra fees. Otherwise the app explains why one store is better.
- **Budget:** flags plans over budget and suggests the cheapest swaps that get under it.
- **Substitutions:** brand or variant missing → another brand; item out of stock → a related item (e.g. toor ↔ moong dal), always
  with the reason shown. You can change any line from its alternatives; the server re-prices overrides and rejects non-substitutes.
- **Fill cart → Ready to pay:** the cart is filled (simulated for Mock) with progress, held for `PAYMENT_WINDOW_MINUTES`, and a
  **"Cart ready: confirm & pay ₹X"** notification is sent (in-app SSE banner; Web Push/FCM stub).
- **Confirm & hand-off:** opens the store app (deep link) or website with the amount and steps. "I've paid" is accepted only
  after the hand-off and only with `userConfirmed: true`; it starts order tracking.
- **Order tracking:** placed → packed → out for delivery → arriving → delivered, with IST times. **Simulated** for Mock.
- **Saved lists & weekly schedule:** days + time in IST, strategy, optional auto-fill (which still waits for you to pay).
- **Settings:** theme, address/pincode, default budget, default plan, which stores to compare, provider status, notifications.

## Configuration

Copy `.env.example` to `.env`. Nothing is required for Mock. See [docs/PROVIDERS.md](docs/PROVIDERS.md) for the official
Instamart/Zepto MCP route, the own-session Playwright route, partnerships, and the legal notes.

## Limitations (honest list)

- All prices, fees, stock, slots and tracking come from the **Mock provider** (sample data). No store has been connected.
- The **MCP** and **Playwright** adapters are skeletons: the transport, guards and flow are written, but response mapping and
  selectors are TODO and need testing against staging or a real logged-in account.
- Fee rules in Mock are illustrative; real fees vary by city, time, cart and membership.
- Quotes live in memory (about 300) and the JSON store is single-instance. Use Redis and Postgres for production (see ARCHITECTURE).
- Web Push / FCM delivery is a stub that logs; in-app SSE notifications work.
- Docker files were not run here (no Docker in the build environment).
