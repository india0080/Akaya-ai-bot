# Translate

Translate text and phrases between Indian and other languages, with text-to-speech.

## Code

| Path | What |
|---|---|
| `app/src/screens/Translate.tsx` | Translate screen (`/translate`) |
| `app/src/lib/mock.ts` | `LANGS`, `PHRASES`, `translate()` (sample translations) |
| `app/src/lib/speech.ts` | `speak()` via the Web Speech API |
| `app/src/screens/onboarding/Slides.tsx` | `SlideTranslate` |

## Status

Translations come from a sample phrase table. Production needs a translation or LLM API behind the backend.

## Try it

`cd app && npm install && npm run dev`, then open the feature from Home or Search.
