/**
 * LocalDemoAuthProvider: used when no Firebase config is present. Clearly a DEMO:
 * - accounts live only in this device's localStorage (password hashed with PBKDF2-SHA256 + random salt);
 * - no email is sent; verification is simulated with a "Demo: mark as verified" button;
 * - password reset only confirms the request.
 * Never use it for real users.
 */
import { AuthError, type AuthProvider, type AuthUser } from './types';
import { normEmail } from './validation';

const ACCOUNTS = 'akaya:demo-accounts';
const SESSION = 'akaya:demo-session';

interface Account {
  uid: string;
  email: string;
  displayName?: string;
  salt: string;
  hash: string;
  verified: boolean;
  createdAt: number;
}

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: 120_000 },
    key,
    256,
  );
  return b64(bits);
}

function readAccounts(): Record<string, Account> {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS) ?? '{}') as Record<string, Account>;
  } catch {
    return {};
  }
}
const writeAccounts = (a: Record<string, Account>) => localStorage.setItem(ACCOUNTS, JSON.stringify(a));
const toUser = (a: Account): AuthUser => ({
  uid: a.uid,
  email: a.email,
  emailVerified: a.verified,
  displayName: a.displayName,
});

export class LocalDemoAuthProvider implements AuthProvider {
  readonly id = 'local-demo' as const;
  readonly isDemo = true;
  private listeners = new Set<(u: AuthUser | null) => void>();

  currentUser(): AuthUser | null {
    const email = localStorage.getItem(SESSION);
    const acc = email ? readAccounts()[email] : undefined;
    return acc ? toUser(acc) : null;
  }

  onAuthStateChanged(cb: (u: AuthUser | null) => void) {
    this.listeners.add(cb);
    queueMicrotask(() => cb(this.currentUser()));
    return () => {
      this.listeners.delete(cb);
    };
  }

  /** async like Firebase, so listeners never re-enter the caller */
  private emit() {
    queueMicrotask(() => {
      const u = this.currentUser();
      this.listeners.forEach((l) => l(u));
    });
  }

  async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    await wait(600);
    const key = normEmail(email);
    const all = readAccounts();
    if (all[key]) throw new AuthError('email-in-use');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const acc: Account = {
      uid: `demo_${crypto.randomUUID()}`,
      email: key,
      displayName,
      salt: b64(salt),
      hash: await hashPassword(password, salt),
      verified: false,
      createdAt: Date.now(),
    };
    writeAccounts({ ...all, [key]: acc });
    localStorage.setItem(SESSION, key);
    this.emit();
    return toUser(acc);
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    await wait(500);
    const acc = readAccounts()[normEmail(email)];
    // same message for unknown email and wrong password (no account enumeration)
    if (!acc || (await hashPassword(password, fromB64(acc.salt))) !== acc.hash)
      throw new AuthError('wrong-credentials');
    localStorage.setItem(SESSION, acc.email);
    this.emit();
    return toUser(acc);
  }

  async sendEmailVerification() {
    if (!this.currentUser()) throw new AuthError('not-signed-in');
    await wait(500); // demo: nothing is sent
  }

  async reload() {
    await wait(300);
    return this.currentUser();
  }

  async demoVerify() {
    const u = this.currentUser();
    if (!u) throw new AuthError('not-signed-in');
    const all = readAccounts();
    all[u.email] = { ...all[u.email], verified: true };
    writeAccounts(all);
    this.emit();
  }

  async sendPasswordResetEmail(email: string) {
    await wait(600); // demo: nothing is sent; same response whether or not the account exists
    void email;
  }

  async signOut() {
    if (localStorage.getItem(SESSION) === null) return;
    localStorage.removeItem(SESSION);
    this.emit();
  }
}
