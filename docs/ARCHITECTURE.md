# Architecture

```mermaid
flowchart LR
  subgraph Client["Akaya app (app/, React PWA)"]
    UI[Screens + sheets] --> Store[(App state\nlocalStorage 'akaya:v1')]
    UI --> Int[integrations/\nMock · Composio · Nango · Backend]
    UI --> Notes[notes/\nMock · LLM via backend]
    UI --> Tiles[Agents sheet tiles]
  end
  Tiles -- "VITE_SHOPPING_AGENT_URL" --> SUI
  Tiles -- "VITE_GROCERY_AGENT_URL" --> GUI
  subgraph Shop["agents/shopping-agent"]
    SUI[React UI :5174] -->|/api| SAPI[Fastify API :8787\nzod · OpenAPI · rate limit · cache · queue · SSE]
    SAPI --> SP[Providers: Mock (default) · Amazon Creators · Flipkart · SerpApi · browser fallback (off)]
  end
  subgraph Groc["agents/grocery-agent"]
    GUI[React UI :5175] -->|/api| GAPI[Fastify API :8788\nzod · OpenAPI · rate limit · cache · queue · SSE · scheduler]
    GAPI --> GP[Stores: Mock (default) · Instamart MCP · Zepto MCP skeletons · Playwright own-session (experimental)]
    GAPI -. "cart ready: confirm & pay" .-> GUI
  end
  Int -. "VITE_AKAYA_API (to build)" .-> BE[(Akaya backend)]
  Notes -. "/notes/summarise (to build)" .-> BE
```

## Pieces

| Piece | Stack | State today |
|---|---|---|
| `app/` | React 19, TypeScript, Vite 8, framer-motion, react-router (HashRouter), vite-plugin-pwa | Fully interactive prototype; data is local or mock. Integrations and LLM notes have provider interfaces that call a backend that is **not built yet** (`VITE_AKAYA_API`). |
| `agents/shopping-agent` | Fastify 5 + zod 4 + Swagger, vitest; React UI | Works end to end on the Mock provider. Real providers are skeletons. |
| `agents/grocery-agent` | Same stack, plus a list scheduler and a checkout state machine | Works end to end on Mock: quote, fill the cart, notify, hand off, the user pays in the store app, mock tracking. MCP and Playwright adapters are skeletons; checkout and payment tools are blocked in code. |
| `bubble-system/` | Vanilla JS + Web Audio | Standalone demo of the bubble's states, moods and SFX. Not wired into the app yet. |

## Shared design language

Pearl orb, brand colours `#0269f8 #7625ef #0dabf4 #08da73`, orange `#E8743B`, Comfortaa (headings) and Manrope (body), and
light/dark themes. The tokens live in `app/src/theme/tokens.css`; the agents carry copies (`frontend/src/theme`) so they stay
self-contained.

## Integration path (in order of effort)

1. **Link out (current):** the Agents sheet tiles open each agent's deployed UI.
2. **Same origin:** serve the agent UIs under `/agents/*` and reverse-proxy their APIs.
3. **Native screens:** call the agent APIs from app screens (typed clients plus OpenAPI) and subscribe to their SSE
   notification streams; forward them to FCM for Android.
4. **Chat/voice routing:** send shopping and grocery intents from Akaya chat to `POST /api/search` and `POST /api/quotes`.

## Before production

- Real auth (the agents use a demo `x-user-id` header), Postgres and Redis in place of the JSON file and in-memory
  stores, and push keys (VAPID/FCM).
- The Akaya backend for integrations (Composio or Nango) and for LLM notes, translation and chat.
- Store and affiliate access: see `agents/*/docs/PROVIDERS.md`.
