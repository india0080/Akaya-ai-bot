import { AuthError, type AuthErrorCode } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normEmail = (e: string) => e.trim().toLowerCase();

export function emailError(email: string): string | null {
  const e = email.trim();
  if (!e) return 'Enter your email';
  if (!EMAIL_RE.test(e)) return 'Enter a valid email, like name@example.com';
  return null;
}

export interface Strength {
  /** 0 (empty) .. 4 (strong) */
  score: 0 | 1 | 2 | 3 | 4;
  label: '' | 'Too weak' | 'Fair' | 'Good' | 'Strong';
  /** unmet hard rules */
  missing: string[];
}

/** Hard rules: 8+ characters, a letter and a number. Length 12+ and symbols raise the score. */
export function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: '', missing: [] };
  const missing: string[] = [];
  if (pw.length < 8) missing.push('8+ characters');
  if (!/[a-zA-Z]/.test(pw)) missing.push('a letter');
  if (!/\d/.test(pw)) missing.push('a number');
  if (missing.length) return { score: 1, label: 'Too weak', missing };
  let s = 2;
  if (pw.length >= 12) s++;
  if (/[^a-zA-Z0-9]/.test(pw) && /[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  const score = Math.min(4, s) as 2 | 3 | 4;
  return { score, label: score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong', missing };
}

export function passwordError(pw: string): string | null {
  if (!pw) return 'Create a password';
  const st = passwordStrength(pw);
  return st.missing.length ? `Password needs ${st.missing.join(', ')}` : null;
}

export function confirmError(pw: string, confirm: string): string | null {
  if (!confirm) return 'Confirm your password';
  return pw === confirm ? null : 'Passwords don’t match';
}

const MESSAGES: Record<AuthErrorCode, string> = {
  'invalid-email': 'That email address doesn’t look right.',
  'weak-password': 'Choose a stronger password (8+ characters with a letter and a number).',
  'email-in-use': 'An account with this email already exists. Try logging in.',
  'wrong-credentials': 'Email or password is incorrect.',
  'user-not-found': 'No account found with this email.',
  'too-many-requests': 'Too many attempts. Please wait a minute and try again.',
  network: 'You seem to be offline. Check your connection and try again.',
  'not-signed-in': 'Your session ended. Please log in again.',
  unknown: 'Something went wrong. Please try again.',
};

export function authMessage(err: unknown): string {
  if (err instanceof AuthError) return MESSAGES[err.code];
  return MESSAGES.unknown;
}
