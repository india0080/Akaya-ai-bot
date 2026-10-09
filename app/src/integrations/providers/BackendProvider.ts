/**
 * Base for real providers. The browser NEVER sees client secrets or tokens:
 *   1. POST {api}/integrations/:app/connect     → backend returns an authorization URL (OAuth 2.0 + PKCE/state)
 *   2. Browser opens the URL (popup / redirect / Custom Tab on Android)
 *   3. Provider redirects to the backend callback; backend exchanges the code and stores tokens encrypted
 *   4. Backend notifies the app (poll /status or websocket) → UI shows "Connected"
 * Actions are executed server-side: POST {api}/integrations/:app/actions/:key
 */
import type { ActionResult, ConnectResult, ConnectStage, IntegrationApp, IntegrationProvider } from '../types';

export abstract class BackendProvider implements IntegrationProvider {
  abstract readonly id: string;
  /** e.g. https://api.akaya.example (set VITE_AKAYA_API). Requests carry the user's session cookie. */
  constructor(protected api: string) {}

  protected async call<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.api}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    return (await res.json()) as T;
  }

  async connect(app: IntegrationApp, onStage?: (s: ConnectStage) => void): Promise<ConnectResult> {
    if (app.kind === 'deeplink') return { ok: true, account: 'Deep link enabled' };
    onStage?.('redirect');
    const { url, connectionId } = await this.call<{ url: string; connectionId: string }>(
      `/integrations/${app.id}/connect`,
      { method: 'POST', body: JSON.stringify({ provider: this.id }) },
    );
    const popup = window.open(url, 'akaya-connect', 'width=520,height=680');
    onStage?.('authorize');
    // TODO: replace polling with a websocket / postMessage from the callback page.
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const s = await this.call<{ status: string; account?: string }>(`/integrations/connections/${connectionId}`);
      if (s.status === 'active') {
        onStage?.('sync');
        popup?.close();
        return { ok: true, account: s.account };
      }
      if (s.status === 'failed') return { ok: false, error: 'Authorization was denied' };
    }
    return { ok: false, error: 'Timed out waiting for authorization' };
  }

  async disconnect(appId: string) {
    await this.call(`/integrations/${appId}`, { method: 'DELETE' });
  }

  async status(appId: string) {
    const s = await this.call<{ status: 'connected' | 'disconnected' | 'expired' }>(`/integrations/${appId}/status`);
    return s.status;
  }

  actions(app: IntegrationApp) {
    return app.abilities;
  }

  runAction(app: IntegrationApp, actionKey: string, input?: string): Promise<ActionResult> {
    return this.call<ActionResult>(`/integrations/${app.id}/actions/${actionKey}`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
  }
}
