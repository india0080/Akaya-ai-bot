import type { ChannelId } from './types.js';

/** Per-user channel credentials. Production: OAuth tokens from the integrations backend (encrypted at rest). */
export interface CredentialProvider {
  get(userId: string, channel: ChannelId): Promise<Record<string, string>>;
}

/** Dev only: one set of credentials from environment variables, shared by every user. */
export class EnvCredentials implements CredentialProvider {
  constructor(private env: Record<string, string | undefined> = process.env) {}
  async get(): Promise<Record<string, string>> {
    return Object.fromEntries(Object.entries(this.env).filter((e): e is [string, string] => typeof e[1] === 'string' && e[1] !== ''));
  }
}
