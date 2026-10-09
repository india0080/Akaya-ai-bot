/**
 * STUB: Composio-backed provider (https://composio.dev).
 * Composio hosts OAuth apps + 100s of tool actions. Your BACKEND holds COMPOSIO_API_KEY and:
 *   - POST /integrations/:app/connect → composio.connectedAccounts.initiate({ userId, authConfigId }) → { redirectUrl, id }
 *   - GET  /integrations/connections/:id → composio.connectedAccounts.get(id) → status ACTIVE|FAILED
 *   - POST /integrations/:app/actions/:key → composio.tools.execute(<TOOL_SLUG>, { userId, arguments })
 * TODO(backend): map Ability.key → Composio tool slugs (e.g. gmail.summarize → GMAIL_FETCH_EMAILS + LLM).
 * TODO(backend): use your own OAuth client IDs (white-label) for Gmail/Outlook so consent shows "Akaya".
 * Never put the Composio API key in VITE_* env vars: those are bundled into the client.
 */
import { BackendProvider } from './BackendProvider';

export class ComposioProvider extends BackendProvider {
  readonly id = 'composio';
}
