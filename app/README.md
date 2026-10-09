# Akaya: mobile app prototype (React + TypeScript + Vite PWA)

A clickable, installable prototype of the Akaya assistant app with **light and dark** themes.
It covers Sign Up → 5-slide onboarding → Home (bento quick actions), Chat, Voice, History, More/Settings and the
feature screens (Translate, Future Message, Smart Note, Search, Upgrade, Support), plus **Apps & Integrations**
(100 apps) and **Voice Notes** (live transcript → structured notes).

**Navigation:** a floating tab bar `Home | Chat | (Voice orb) | History | More`. The glowing centre orb
(animated waveform) opens Voice. More holds settings.

All data is sample data, stored in the browser (`localStorage`). There is no backend. AI replies, OTP and translation are mocked.

## Requirements

- Node.js **20.19+** (or 22+) and npm

## Setup and scripts

```bash
npm install            # install dependencies
npm run dev            # dev server with hot reload → http://localhost:5173
npm run build          # type-check + production PWA build → dist/
npm run preview        # serve dist/ locally → http://localhost:4173
npm run build:standalone  # single self-contained HTML → dist-standalone/index.html
npm run lint           # ESLint (flat config, typescript-eslint, react-hooks)
npm run format         # Prettier
npm run typecheck      # tsc only
```

- **Desktop:** the app renders inside a centred 390×844 phone frame with a status bar.
- **Phone (or narrow window):** it runs full screen with safe-area insets.
- **Install as an app (PWA):** deploy `dist/` to any static host over HTTPS. Then use "Add to Home Screen" (iOS) or "Install app" (Android/Chrome). The service worker precaches everything, so it works offline once installed.
- **Standalone file:** `dist-standalone/index.html` has JS, CSS and fonts inlined and opens with a double click (`file://`). It has no service worker. Routing uses the URL hash, so it works without a server.

## Tech stack

| Concern   | Choice                                                                     |
| --------- | -------------------------------------------------------------------------- |
| Build     | Vite, `@vitejs/plugin-react`, `vite-plugin-pwa`, `vite-plugin-singlefile`  |
| UI        | React 19 + TypeScript (strict)                                             |
| Routing   | `react-router-dom` (`HashRouter`, works on static hosts and `file://`)     |
| Animation | `framer-motion` (onboarding, sheets, lists) + one `<canvas>` for the pearl |
| Styling   | Plain CSS files per component + design tokens as CSS custom properties     |
| Fonts     | `@fontsource/comfortaa`, `@fontsource/manrope` (bundled, no CDN)           |
| State     | React Context + `useState`, persisted to `localStorage`                    |
| Quality   | ESLint (flat config) + Prettier + EditorConfig                             |

There is no UI kit, CSS-in-JS or state library: anyone who knows React can read it.

## Folder structure

```
public/                 favicon, apple-touch icon, PWA icons
src/
  main.tsx              entry: fonts, global CSS, providers, router
  App.tsx               phone frame, status bar, routes, auth/onboarding guard, bottom nav
  theme/
    tokens.css          brand colours, gradients, light + dark token sets  ← edit colours here
    global.css          reset, phone frame, shared primitives (.card, .btn, .input, .list…)
    useThemeSync.ts     applies Light/Dark/System + text size to <html>
  state/
    types.ts            typed app state (settings, today items, notes, chats…)
    store.tsx           AppProvider + useApp() hook with all actions, localStorage persistence
  lib/
    pearl.ts            canvas renderer for the Akaya pearl (iridescent bubble)
    anim.ts             small animation hooks (staged timelines, clock, typewriter)
    speech.ts           Web Speech API helpers (text-to-speech, recognition)
    time.ts             greeting, time/date formatting
    mock.ts             sample data, mock AI replies, demo phrasebook for Translate
    history.ts          builds the History feed (chats, voice, floating, translations, reminders, notes…)
  components/           reusable UI: Pearl, Sheet, BottomNav, StatusBar, Toast, Controls
                        (Toggle, Segmented, RangeSlider), Icon, Logo, Avatar, ScreenHeader…
  integrations/         Apps & Integrations: catalog (100 apps), provider interface, Mock/Composio/Nango providers
  notes/                Voice Notes: modes, recorder (mic + speech), IndexedDB audio store, notes providers, export
  screens/
    Apps.tsx (+ apps/AppSheet.tsx), vnotes/ (VoiceNotes, Recorder, NoteView, NotePanels, MindMap),
    SignUp, Onboarding (+ onboarding/Slides.tsx), Home (+ home/ Bento, TodayRow,
    FeatureSlider, RecentChats), Chat, Voice, More, Translate, FutureMessages, Notes,
    Search, History (unified timeline), Upgrade, Support
    sheets/             bottom sheets: Notifications, Read Screen, Today, Agents, Explore, Loan
```

## Theming

- Tokens live in `src/theme/tokens.css`. `:root` holds the brand palette (`--blue #0269f8`, `--violet #7625ef`, `--sky #0dabf4`, `--green #08da73`, `--orange #E8743B`). `[data-theme='light']` and `[data-theme='dark']` hold the surface and text tokens.
- Components only use tokens (`var(--surface)`, `var(--text-2)`…), so a new theme is just a new token block.
- **Text size** (More → Appearance) sets `--ts`. The root font-size is `16px × --ts` and all type is in `rem`, so the whole UI scales.
- **Theme** Light / Dark / System: System follows `prefers-color-scheme` live.

## State

`useApp()` returns `state` plus actions, e.g. `setSetting`, `toggleToday`, `addNote`, `scheduleMessage`, `newChat`, `addMessage`, `logout`.
Everything is saved under the `akaya:v1` localStorage key. **Log out** clears it and returns to Sign Up.

To connect a real backend, replace the bodies of the actions in `state/store.tsx` and `mockReply`/`translate` in `lib/mock.ts` with API calls. The screens don't need to change.

## History

`lib/history.ts → buildHistory(state)` merges everything into one timeline:

- chats, Voice chats, Floating-bubble replies (WhatsApp/Gmail), translations
- reminders/events and follow-ups, Smart Notes, Future Messages

Voice and Translate log new entries via `logActivity()`. Each card's ⋮ menu has **Open**, **Pin to top** and **Delete**.
Pin and delete are stored as keys in `state.history`, so deleting from History doesn't delete the source item.
Chips filter by type and search matches title, preview and tags. Filter sets sort order and time range.
Tapping a card opens its source: a chat thread, the Today sheet, Notes or Future Messages. Voice, floating and translation entries open a detail sheet instead.

## Apps & Integrations

**Where:** More → *Apps & Integrations*, Home (*Your apps* row and the *Connect your apps* card), and Chat (**+** → *Apps*).
The catalog has **100 apps** for Indian office users across 16 categories (Email, Messaging, Calendar, Notes & Docs, Storage,
Productivity, CRM & Sales, Finance, Social, Shopping & Travel, Developer, Meetings, Forms, Support, HR, Automation),
with search, category chips, a *Connected* row, a *Popular* grid and a grouped list. Each app has a detail sheet
(what Akaya can do, permissions, per-ability toggles, Disconnect) and a demo connect flow: consent → connecting → connected + toast.
Connections persist in `state.integrations`, show on Home and in History (*Connected Notion*), and Chat answers sample questions about them.

### Architecture (`src/integrations/`)

| File | Purpose |
| --- | --- |
| `types.ts` | `IntegrationApp`, `Connection`, and the `IntegrationProvider` interface: `connect(app, onStage)`, `disconnect(appId)`, `status(appId)`, `actions(app)`, `runAction(appId, key, input)` |
| `catalog.ts` | the 100 apps: name, category, description, brand colour, monogram, connect kind, abilities, permissions |
| `providers/MockProvider.ts` | default: simulated OAuth stages, no network |
| `providers/BackendProvider.ts` | base class for real providers: the **browser only talks to your backend** (`VITE_AKAYA_API`): `POST /integrations/:app/connect` → popup to the provider's consent page → backend stores tokens → client polls status |
| `providers/ComposioProvider.ts`, `NangoProvider.ts` | documented stubs (TODOs) for Composio or Nango behind your backend |
| `index.ts` | picks the provider from `VITE_INTEGRATIONS_PROVIDER=mock\|composio\|nango` |

Connect kinds: **Sign in** (OAuth), **Official API** (WhatsApp Business Platform), **Deep link** (Shopping & Travel apps such as
Swiggy, Zomato, Uber, Ola, Amazon, Flipkart, MakeMyTrip: Akaya only prepares the action and opens the app, with no account access),
and **Connector** (apps without a public OAuth API, e.g. Tally, Obsidian, Proton Mail, which need a local bridge or export).

### Wiring real OAuth (production checklist)

- **Never put client secrets or API keys in the app.** `VITE_*` variables are bundled into the JS. Keep `COMPOSIO_API_KEY`,
  `NANGO_SECRET_KEY` and OAuth client secrets on the backend. Store refresh tokens encrypted on the server. Use the
  authorization-code flow with PKCE and `state`, and request the smallest scopes per toggle.
- **Gmail / Google Workspace (Google OAuth):** create an OAuth client in Google Cloud and configure the consent screen.
  Gmail read/modify scopes (e.g. `gmail.readonly`, `gmail.modify`) are **restricted scopes**: public apps need Google's
  OAuth app verification **and an annual CASA security assessment** (Cloud Application Security Assessment) by an approved assessor.
  `gmail.send` and Calendar scopes are *sensitive* (verification needed, no CASA). Until you are verified, you are limited to test users.
- **Outlook / Microsoft 365 (Microsoft Graph):** register the app in Microsoft Entra ID with delegated permissions such as
  `Mail.Read`, `Mail.Send`, `Calendars.ReadWrite` and `offline_access`, using the redirect URI on your backend.
  Use publisher verification for multi-tenant apps. Some organisations require admin consent.
- **Notion:** create a *public integration* to get an OAuth client ID and secret. The user picks which pages Akaya can access,
  and the backend exchanges the code at `https://api.notion.com/v1/oauth/token`.
- **WhatsApp:** use only the official **WhatsApp Business Platform (Cloud API)**: Meta business verification, approved message
  templates for business-initiated messages, and the 24-hour customer-service window. You can also use plain
  **click-to-chat** links (`https://wa.me/<number>?text=…`). **Do not use unofficial WhatsApp automation libraries or bots.**
  They break WhatsApp's terms and get numbers banned.
- Slack, Zoom, Jira, HubSpot, Zoho, Razorpay and others follow the same backend OAuth pattern. Check each provider's app review process.

### Logos

App tiles are **monogram placeholders** (letters on the brand colour) in `components/AppTile.tsx`, **not** official logos.
Before release, replace them with official logo assets that you are permitted to use, following each brand's guidelines.
App names and marks belong to their owners.

## Voice Notes

**Where:** the Home bento (*Voice Notes* tile), the Voice tab (*Voice Notes* button) and History (*Voice Notes* filter).

- **Modes:** Lecture (School / College / University level), Meeting, Business meeting (attendees, decisions, action items
  with owners and due dates), Voice memo, Interview, Call summary, Ideas & journal, Podcast/talk.
- **Recording screen:** the Akaya pearl reacts to the live mic level, with a live timer, a waveform from the real input
  volume, title/date/subject chips, a live caption, **Bookmark / Stop / Pause-Resume**, and an EN ⇄ हि language switch (`en-IN` / `hi-IN`).
- **Tabs:** Transcript (timestamps, speakers, language tag, bookmarks) · Notes (numbered sections, formulas, key terms,
  attendees, decisions, auto-updating) · Summary (TL;DR + bullets + stats) · Mind map (radial SVG) · Action items (tick off).
- **Saved notes:** playback with ±5 s, a scrubber, 1×/1.5×/2× speed and tap-a-line-to-seek. Copy / Share (Web Share API) /
  Export (.md) / Ask Akaya. Recent recordings, delete.
- **Demo mode:** *Sample lecture* (linear algebra) and *Business meeting* (Q4 launch) stream a script word by word,
  so the transcript, notes, mind map and action items build live without a microphone.

### How it works (`src/notes/`)

| File | Purpose |
| --- | --- |
| `recorder.ts` | `LiveRecorder`: `getUserMedia` + `MediaRecorder` (audio), `AnalyserNode` (level), Web Speech API live transcription with auto-restart |
| `audioStore.ts` | audio blobs in **IndexedDB** (`akaya-voice-notes`); transcripts and notes stay in app state (localStorage) |
| `types.ts` | `Segment`, `StructuredNotes`, `VoiceNote`, and the `NotesProvider` interface: `update(segments, meta) → StructuredNotes` |
| `mockProvider.ts` | `MockNotesProvider`: on-device rules (sections, definitions "X is called…", actions "Rahul will … by Friday", decisions, mind map). Sample scripts carry structure hints |
| `index.ts` | `notesProvider`. `VITE_NOTES_PROVIDER=llm` switches to `LlmNotesProvider`, which POSTs the transcript to your backend `/notes/summarise` (the LLM key stays on the server) |
| `scripts.ts`, `modes.ts`, `export.ts` | demo and seed scripts, mode definitions, Markdown export |

Browser support: live transcription needs the Web Speech API (Chrome, Edge, Safari). Chrome sends audio to Google's speech
service for recognition. Other browsers still record audio, but without a live transcript. Ask for consent before recording other people.

## Handy URLs (for QA and screenshots)

- `#/onboarding?s=3`: open onboarding at slide 3
- `#/home?sheet=notifications|read|today|agents|explore|loan`: open a Home sheet directly (`&kind=reminder` filters Today)
- `#/chat?new=1&q=Plan my weekend`: start a chat with a prompt
- `#/history?f=floating&q=neha`: History with a type filter and search query
- `#/apps?c=finance`, `#/apps?q=mail`, `#/apps?app=gmail`, `#/apps?app=notion&step=consent`: Apps catalog, filter, search, detail, consent
- `#/chat?attach=menu|apps|notes`: Chat with the + menu or a picker open
- `#/vnotes`: Voice Notes home · `#/vnotes/rec?demo=lecture|business&tab=notes|transcript|summary|mind|actions`: live demo recording
- `#/vnotes/rec?mode=meeting&title=Team%20sync&lang=hi-IN`: real mic recording in a mode · `#/vnotes/vn-calc?tab=mind`: a saved note
- `?statusbar=1&clock=9:41#/home`: force the fake status bar with a fixed clock

## Browser notes

- **Voice** uses `getUserMedia` (needs HTTPS or localhost) to drive the pearl from the mic level. Speech-to-text uses the Web Speech API where it exists (Chrome/Edge/Safari). Without it there is a demo mode, and if mic permission is denied a friendly fallback appears.
- **Read aloud** uses `speechSynthesis`, with the voice speed from Settings.
- The pearl's thin-film shimmer uses canvas `filter: blur()`. Browsers without it (older Safari) draw a simpler pearl.
