import type { AuthService } from './types';

const wait = () => new Promise((r) => setTimeout(r, 400));
const notConnected = 'Sign-in is not connected yet. A developer must plug a backend into src/services/auth.';

/** Development stub: validates input shape and reports that no backend is connected. */
export const stubAuthService: AuthService = {
  async signIn({ email, password }) {
    await wait();
    if (!email || password.length < 8) return { ok: false, error: 'Enter your email and a password of at least 8 characters.' };
    return { ok: false, error: notConnected };
  },
  async signUp({ email, password, name }) {
    await wait();
    if (!name || !email || password.length < 8) return { ok: false, error: 'Fill in your name, email and a password of at least 8 characters.' };
    return { ok: false, error: notConnected };
  },
  async sendPasswordReset(email) {
    await wait();
    return email.includes('@') ? { ok: true } : { ok: false, error: 'Enter a valid email address.' };
  },
  async signInWithGoogle() {
    await wait();
    return { ok: false, error: notConnected };
  },
  async signOut() {},
};
