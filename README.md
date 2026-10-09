# Akaya AI Bot

Monorepo for **Akaya**, a mobile-first AI assistant (PWA + Android app), its two commerce agents, back-end services,
shared packages, the bubble character system, and the design and marketing assets. One npm workspace, one lockfile.

## Folder tree

```
akaya-ai-bot/
├── app/                         Main Akaya app: React 19 + TypeScript + Vite PWA, Android via Capacitor (one.akaya.app)
│   ├── src/
│   │   ├── features/reminders/  Reminders feature module: dashboard, composer, detail, duplicates, notifications
│   │   ├── commerce/            Link cards, disclosure, chat intent card (all via @akaya/affiliate)
│   │   ├── screens/             Home (+ home/ Today slider, SnapSlider), Chat, Voice, Travel, Shopping, Earnings…
│   │   ├── native/              Capacitor wrappers: local notifications, external links, back button
│   │   ├── state/  lib/  theme/ Store + types, helpers (useNow, time, speech), app-level CSS (kit.css)
│   │   └── auth/ chat/ future/ integrations/ notes/ components/
│   └── android/                 Capacitor Android project
├── agents/
│   ├── shopping-agent/          backend (Fastify + zod) + frontend (React): search, compare, price alerts, "Buy on X"
│   └── grocery-agent/           backend + frontend: list → compare 5 stores → fill cart → you pay in the store app
├── services/
│   ├── link-redirect/           Short links + click log + earnings imports/reports for affiliate/UTM links
│   └── future-message/          Scheduled message sender (queue + per-channel adapters)
├── packages/                    Shared code (single source of truth)
│   ├── affiliate/               Platform registry, deep links, affiliate IDs, UTM, disclosure, intent detection
│   ├── reminders/               Reminder logic + Hindi/Hinglish/English parser (pure TS, tested)
│   ├── tz/                      Time-zone maths (Intl only)
│   ├── server-kit/              Node store, cache, queue, notifications, SSE, RNG for agents/services
│   ├── ui/                      Design system: tokens, Pearl, Icon, Sheet, Toast, controls (source-only)
│   └── config/                  Shared ESLint + TypeScript configs
├── docker/                      Shared Dockerfiles (node service, Vite web) + nginx template
├── scripts/                     Dev helpers (agent-dev.mjs)
├── docs/                        ARCHITECTURE.md, AFFILIATE.md, docs index
├── features/                    One README per app feature, mapping it to code
├── bubble-system/               Bubble character demo (HTML/JS)
├── design/  marketing/          Images, screen sheets, videos
├── .jscpd.json                  Copy/paste detection config (npm run dupcheck)
└── .prettierrc.json             Prettier config for every workspace
```

## Quick start

```bash
npm install                      # all workspaces; builds the compiled packages (postinstall)
npm run dev -w @akaya/app                      # http://localhost:5173
cd agents/shopping-agent && npm run dev        # UI :5174 · API :8787 (Swagger /docs)
cd agents/grocery-agent && npm run dev         # UI :5175 · API :8788 (Swagger /docs)
npm run dev -w @akaya/link-redirect            # :8790 (needs .env, see its README)
```

Node 20+ (Node 22+ for the Capacitor CLI). Run workspace scripts from the root with `-w <name>`.

| Script | What |
|---|---|
| `npm run build:packages` | Build `@akaya/affiliate`, `server-kit`, `tz`, `reminders` (dist/) |
| `npm run lint` / `typecheck` / `test` / `build` | Every workspace that has the script |
| `npm run dupcheck` | jscpd copy/paste report (fails above the threshold in `.jscpd.json`) |
| `npm run ci` | All of the above, in order |
| `cd app && npm run android:apk` | Debug APK (needs JDK 21 and the Android SDK) |

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/AFFILIATE.md](docs/AFFILIATE.md) (programmes, rules, FTC/ASCI, env vars)
- [app/README.md](app/README.md) · [features/](features/README.md) · [agents/](agents/README.md)
- Packages: [affiliate](packages/affiliate/README.md) · [reminders](packages/reminders/README.md) · [tz](packages/tz/README.md) ·
  [server-kit](packages/server-kit/README.md) · [ui](packages/ui/README.md) · [config](packages/config/README.md)
- Services: [link-redirect](services/link-redirect/README.md) · [future-message](services/future-message/README.md)

## Status (honest)

- Everything runs on **sample data**, labelled *Sample* in the UI. No real store, affiliate, LLM or integration account is
  connected; real adapters read `.env` and are documented skeletons.
- Affiliate IDs are all empty, so links carry UTM tags only; the Earnings screen is sample data. `services/link-redirect`
  is tested but not deployed, and the app does not call it yet. Network report API sync is stubbed (CSV import works).
- Neither agent pays or places orders. Payment always happens in the store's own app, approved by the user.
- Reminders are stored on the device. Android alerts work with the app closed; exact timing needs the *Alarms & reminders*
  permission on Android 12+. Notification buttons open the app to apply the action.
- Email auth runs in **Demo mode** until `VITE_FIREBASE_*` is set. Future Message in the app is demo mode.
- Docker files are written but have not been run (no Docker in the build environment).
- Debug APKs are attached to GitHub Releases, never committed.

## Repo notes

- Media (about 120 MB of PNG/MP4) is committed directly. If the repo grows, move `marketing/` and `design/` to Git LFS
  (`.gitattributes` has the patterns ready, commented out).
- Never commit `.env` files, keystores, `google-services.json` or `secrets/` (all git-ignored).
