# Integrations

Connect apps (mail, calendar, chat, docs and so on) so Akaya can act in them.

## Code

| Path | What |
|---|---|
| `app/src/integrations/index.ts` | Chooses a provider from `VITE_INTEGRATIONS_PROVIDER` (`mock`, `composio` or `nango`) and `VITE_AKAYA_API` |
| `app/src/integrations/providers/` | `MockProvider` (default), `BackendProvider`, `ComposioProvider`, `NangoProvider` |
| `app/src/integrations/catalog.ts, types.ts` | App catalogue, categories and types |
| `app/src/screens/Apps.tsx, app/src/screens/apps/AppSheet.tsx` | Apps screen and per-app connect sheet |
| `app/src/components/AppTile.tsx` | App tile (brand logo on a white tile; monogram fallback) |
| `app/scripts/gen-logos.mjs`, `logo-map.json` | Generates `logos.generated.ts` from CC0/MIT/Apache icon sets (`npm run logos`) |

## Status

Only the Mock provider works. Composio and Nango need the Akaya backend to hold the OAuth tokens; no keys belong in the client.

## Try it

`cd app && npm install && npm run dev`, then open the feature from Home or Search.
