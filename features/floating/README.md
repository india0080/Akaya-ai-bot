# Floating

A bubble that floats over other apps and offers replies, plus "Read screen", which explains what is on screen.

## Code

| Path | What |
|---|---|
| `app/src/screens/home/Bento.tsx` | Floating on/off tile on Home (`settings.floating`) |
| `app/src/screens/sheets/ReadScreenSheet.tsx` | Read Screen demo: capture, then scan, then explain with actions |
| `app/src/screens/onboarding/Slides.tsx` | `SlideFloating` onboarding illustration |
| `app/src/components/Pearl.tsx, app/src/lib/pearl.ts` | The pearl orb used by the bubble |
| `app/src/state/types.ts` | `settings.floating`; activity kind `floating` |
| `app/src/screens/History.tsx` | Floating replies in history |
| `bubble-system/demo/` | Standalone bubble character (states, moods, SFX) |
| `marketing/videos/floating-tutorial.mp4, homebubble-promo-720p.mp4` | Videos |

## Status

In the web prototype this is simulated. A real overlay needs a native Android layer (`SYSTEM_ALERT_WINDOW` and an AccessibilityService or MediaProjection for Read screen), which needs Play policy review.

## Try it

`cd app && npm install && npm run dev`, then open the feature from Home or Search.
