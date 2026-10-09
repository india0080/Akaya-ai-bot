# Akaya: mobile app prototype (React + TypeScript + Vite PWA)

A clickable, installable prototype of the Akaya assistant app with **light and dark** themes.
It covers Sign Up → 5-slide onboarding → Home (bento quick actions), Chat, Voice, History, More/Settings and the
feature screens (Translate, Future Message, Smart Note, Search, Upgrade, Support), plus **Apps & Integrations**
(100 apps) and **Voice Notes** (live transcript → structured notes).

**Navigation:** a floating tab bar `Home | Chat | (Voice orb) | History | More`. The glowing centre orb
(animated waveform) opens Voice. More holds settings.

All data is sample data, stored in the browser (`localStorage`). There is no backend. AI replies, phone OTP, Google sign-in and translation are mocked. **Email sign-up / log-in** uses Firebase Auth when configured, otherwise a clearly labelled local Demo mode (see below). An **Android APK** is built with Capacitor.

## Requirements

- Node.js **20.19+** (or 22+) and npm. The Capacitor CLI (Android builds) needs **Node 22+**.

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
npm run build:android  # Android web build + cap sync (see "Android app")
npm run android:apk    # build:android + gradle assembleDebug
```

- **Desktop:** the app renders inside a centred 390×844 phone frame with a status bar.
- **Phone (or narrow window):** it runs full screen with safe-area insets.
- **Install as an app (PWA):** deploy `dist/` to any static host over HTTPS. Then use "Add to Home Screen" (iOS) or "Install app" (Android/Chrome). The service worker precaches everything, so it works offline once installed.
- **Standalone file:** `dist-standalone/index.html` has JS, CSS and fonts inlined and opens with a double click (`file://`). It has no service worker. Routing uses the URL hash, so it works without a server.

## Email sign-in (`src/auth/`)

Sign Up has **Email** (email + password), **Phone** (OTP, demo) and **Continue with Google** (demo). Email accounts get
real screens: **Sign up** (with validation and a strength meter) → **Verify your email** → onboarding, plus **Log in**,
**Forgot password** and **Log out** (More → Log out).

| File | What |
|---|---|
| `src/auth/types.ts` | `AuthProvider` interface (`signUp`, `signIn`, `sendEmailVerification`, `reload`, `sendPasswordResetEmail`, `signOut`, `onAuthStateChanged`) and `AuthError` codes |
| `src/auth/firebase.ts` | `FirebaseAuthProvider`: Firebase JS SDK (modular API, v13), loaded lazily |
| `src/auth/localDemo.ts` | `LocalDemoAuthProvider`: **demo only**. Accounts live in this device's localStorage, with passwords hashed using PBKDF2-SHA256 and a random salt. No email is sent: verification is simulated with "Demo: mark as verified", and password reset only confirms the request. The UI shows a **DEMO MODE** badge. |
| `src/auth/validation.ts` | Email format check; password rules (8+ characters, a letter and a number; strength rises with length, mixed case and symbols); confirm match; friendly error messages |
| `src/auth/index.ts` | Picks Firebase when the four required `VITE_FIREBASE_*` values are set, otherwise Demo mode |
| `src/screens/auth/` | `EmailSignUpForm`, `Login`, `VerifyEmail`, `ForgotPassword`, shared fields (`AuthBits`), `Auth.css` (light + dark) |

Rules: an unverified account can't get into the app (log in sends it to *Verify your email*). Log in shows the same error
for an unknown email and a wrong password, and *Forgot password* always says "if an account exists". If the provider ends
the session, the app logs out too.

### Firebase setup (production)

1. In the [Firebase console](https://console.firebase.google.com/), create a project.
2. Go to **Build → Authentication → Get started → Sign-in method** and enable **Email/Password**. Optionally set the
   email templates' sender name and action URL under *Templates*.
3. In **Project settings → Your apps**, add a **Web app** and copy its config values. The app runs in a WebView, so
   it uses the Web SDK config.
4. Also add an **Android app** with package name **`one.akaya.app`**. This is needed if you later add native Google
   sign-in or FCM; for those, add the debug and release SHA-1 fingerprints (`cd android && ./gradlew signingReport`).
   `google-services.json` is **not** needed for Email/Password through the Web SDK. If you add it, keep it out of git.
5. In **Authentication → Settings → Authorized domains**, add `localhost` (the Android app serves from
   `https://localhost`) and your web domain.
6. Create `app/.env.local` (git-ignored; see `.env.example`):

   ```bash
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_APP_ID=1:...:web:...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...   # optional
   VITE_FIREBASE_STORAGE_BUCKET=...        # optional
   ```

7. Rebuild (`npm run dev`, or `npm run android:apk` for the APK). The DEMO MODE badge disappears once Firebase is active.

No keys are committed. Firebase web config values aren't secrets, but protect the project with Authorized domains, App
Check and sensible quota settings.

## Android app (Capacitor)

The APK wraps the same Vite build in a WebView using Capacitor 8 (`capacitor.config.ts`, app ID **`one.akaya.app`**,
name **Akaya**). The native project is in `android/`.

- **Icon:** adaptive (pearl foreground on a deep-violet background) plus legacy icons, generated from `assets/` with
  `npm run android:assets`.
- **Splash:** light and dark variants; on Android 12+ the system splash shows the pearl icon on the theme background.
- **Status bar:** edge-to-edge (Capacitor SystemBars); the web content draws under the bar using `env(safe-area-inset-*)`,
  and `src/native/useNativeShell.ts` switches light/dark icons with the app theme.
- **Back button:** closes the top sheet first, then goes back; on Home and Sign Up it minimises the app
  (`src/native/backStack.ts`).
- **Permissions:** `INTERNET`, `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS`. The mic permission is requested at runtime the
  first time Voice or Voice Notes uses the microphone (Capacitor forwards the WebView request to Android).
- The Android build omits the PWA service worker (`vite build --mode android`).

### Build a debug APK

Requirements: JDK 21, Android SDK (platform 36, build-tools 35+), Node 22+ for the Capacitor CLI.

```bash
npm install
npm run build:android                  # vite build --mode android + npx cap sync android
cd android && ./gradlew assembleDebug  # → android/app/build/outputs/apk/debug/app-debug.apk
# or: npm run android:apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Release build (Play Store AAB)

Debug APKs are signed with the local debug key and can't go to Play. For a release:

1. Create an upload keystore **once** and keep it outside the repo (back it up; losing it means a key reset):
   `keytool -genkeypair -v -keystore ~/keys/akaya-upload.jks -alias akaya-upload -keyalg RSA -keysize 2048 -validity 10000`
2. Add the signing details to `~/.gradle/gradle.properties` (not the repo):
   `AKAYA_UPLOAD_STORE_FILE=/home/you/keys/akaya-upload.jks`, `AKAYA_UPLOAD_STORE_PASSWORD=...`,
   `AKAYA_UPLOAD_KEY_ALIAS=akaya-upload`, `AKAYA_UPLOAD_KEY_PASSWORD=...`
3. Add a `signingConfigs.release` block in `android/app/build.gradle` that reads those properties, and set
   `buildTypes.release.signingConfig signingConfigs.release`.
4. Bump `versionCode` and `versionName` in `android/app/build.gradle`, then run
   `npm run build:android && cd android && ./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`.
5. In Play Console, use **Play App Signing** (Google holds the app signing key; you upload with the upload key), then
   upload the AAB to an internal testing track first.

Without step 3, `./gradlew assembleRelease` produces an **unsigned** APK (`app-release-unsigned.apk`), which is useful for
size checks only. Keystores (`*.jks`, `*.keystore`) are git-ignored.

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
assets/                 source images for the Android icon + splash (@capacitor/assets)
android/                Capacitor Android project (app ID one.akaya.app)
capacitor.config.ts     Capacitor config
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
  auth/                 email auth: AuthProvider interface, Firebase + LocalDemo providers, validation
  native/               Capacitor glue: status bar, splash, Android back button stack
  integrations/         Apps & Integrations: catalog (100 apps), provider interface, Mock/Composio/Nango providers
  notes/                Voice Notes: modes, recorder (mic + speech), IndexedDB audio store, notes providers, export
  screens/
    Apps.tsx (+ apps/AppSheet.tsx), vnotes/ (VoiceNotes, Recorder, NoteView, NotePanels, MindMap),
    auth/ (EmailSignUpForm, Login, VerifyEmail, ForgotPassword), SignUp, Onboarding (+ onboarding/Slides.tsx), Home (+ home/ Bento, TodayRow,
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
