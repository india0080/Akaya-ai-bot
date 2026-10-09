/**
 * STUB: Nango-backed provider (https://nango.dev): open-source OAuth + sync infrastructure.
 * Backend holds NANGO_SECRET_KEY; frontend may use the public Connect UI session token:
 *   - POST /integrations/:app/connect → nango.createConnectSession({ end_user, allowed_integrations:[app] })
 *     → return { url: connectUiUrl, connectionId }
 *   - GET  /integrations/connections/:id → nango.getConnection(providerConfigKey, connectionId)
 *   - POST /integrations/:app/actions/:key → nango.triggerAction(...) or call the API with nango.proxy(...)
 * TODO(backend): define Nango integrations (provider config keys) per app id in the catalog.
 * TODO(frontend): optionally use @nangohq/frontend Connect UI instead of a popup URL.
 */
import { BackendProvider } from './BackendProvider';

export class NangoProvider extends BackendProvider {
  readonly id = 'nango';
}
