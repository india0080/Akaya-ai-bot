/** Demo provider: simulates the OAuth round-trip with delays and returns canned action results. */
import type { ActionResult, ConnectResult, ConnectStage, IntegrationApp, IntegrationProvider } from '../types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MockProvider implements IntegrationProvider {
  readonly id = 'mock';
  private connected = new Set<string>();

  constructor(private account = 'priya@example.com') {}

  async connect(app: IntegrationApp, onStage?: (s: ConnectStage) => void): Promise<ConnectResult> {
    onStage?.('redirect');
    await wait(app.kind === 'deeplink' ? 300 : 650);
    onStage?.('authorize');
    await wait(app.kind === 'deeplink' ? 300 : 700);
    onStage?.('sync');
    await wait(550);
    this.connected.add(app.id);
    const account =
      app.kind === 'deeplink'
        ? 'Deep link enabled'
        : app.kind === 'business-api'
          ? 'Business number +91 98765 43210'
          : this.account;
    return { ok: true, account };
  }

  async disconnect(appId: string): Promise<void> {
    await wait(250);
    this.connected.delete(appId);
  }

  async status(appId: string) {
    return this.connected.has(appId) ? ('connected' as const) : ('disconnected' as const);
  }

  actions(app: IntegrationApp) {
    return app.abilities;
  }

  async runAction(app: IntegrationApp, actionKey: string): Promise<ActionResult> {
    await wait(400);
    const ability = app.abilities.find((x) => x.key === actionKey);
    return { ok: true, text: `(${app.name} · sample) ${ability?.label ?? actionKey}: done.` };
  }
}
