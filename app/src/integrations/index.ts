/**
 * Integrations entry point. Pick the provider with VITE_INTEGRATIONS_PROVIDER = mock | composio | nango
 * and VITE_AKAYA_API = your backend base URL. Defaults to the in-browser MockProvider (demo).
 */
import type { IntegrationProvider } from './types';
import { MockProvider } from './providers/MockProvider';
import { ComposioProvider } from './providers/ComposioProvider';
import { NangoProvider } from './providers/NangoProvider';

function create(): IntegrationProvider {
  const kind = import.meta.env.VITE_INTEGRATIONS_PROVIDER ?? 'mock';
  const api = import.meta.env.VITE_AKAYA_API ?? '';
  if (kind === 'composio' && api) return new ComposioProvider(api);
  if (kind === 'nango' && api) return new NangoProvider(api);
  return new MockProvider();
}

export const integrations: IntegrationProvider = create();
export * from './types';
export { APPS, APP_BY_ID, CATEGORIES, POPULAR, KIND_LABEL } from './catalog';
