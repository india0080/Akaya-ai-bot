import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { useApp } from '../../state/store';
import { auth, authMessage, type AuthUser } from '../../auth';
import { FormError } from './AuthBits';
import { AuthLayout } from './AuthLayout';

const COOLDOWN = 30;

export function VerifyEmail() {
  const { signIn } = useApp();
  const nav = useNavigate();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [busy, setBusy] = useState<'check' | 'resend' | 'demo' | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [wait, setWait] = useState(COOLDOWN);

  useEffect(() => auth.onAuthStateChanged(setUser), []);
  useEffect(() => {
    const id = setInterval(() => setWait((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  if (user === undefined)
    return (
      <div className="au-loading">
        <span className="spinner" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;

  const finish = (u: AuthUser) => {
    signIn('email', u.email);
    nav('/onboarding', { replace: true });
  };

  const check = async () => {
    setErr(null);
    setNote(null);
    setBusy('check');
    try {
      const u = await auth.reload();
      if (u?.emailVerified) return finish(u);
      setNote('Not verified yet. Open the link in the email, then tap the button again.');
    } catch (e) {
      setErr(authMessage(e));
    }
    setBusy(null);
  };
  const resend = async () => {
    setErr(null);
    setNote(null);
    setBusy('resend');
    try {
      await auth.sendEmailVerification();
      setWait(COOLDOWN);
      setNote(auth.isDemo ? 'Demo mode: no email was sent.' : 'Sent again. It can take a minute to arrive.');
    } catch (e) {
      setErr(authMessage(e));
    }
    setBusy(null);
  };
  const demo = async () => {
    setBusy('demo');
    await auth.demoVerify?.();
    const u = await auth.reload();
    if (u) finish(u);
  };
  const other = async () => {
    await auth.signOut();
    nav('/signup?tab=email', { replace: true });
  };

  return (
    <AuthLayout
      icon="mail"
      tone="blue"
      back="/signup?tab=email"
      title="Verify your email"
      sub={
        <>
          We sent a verification link to <b>{user.email}</b>. Open it to activate your account.
        </>
      }
    >
      <div className="au-form">
        <FormError msg={err} />
        {note && <p className="au-note">{note}</p>}
        <button className="btn btn-primary btn-block su-cta" onClick={() => void check()} disabled={!!busy}>
          {busy === 'check' ? <span className="spinner light" /> : <Icon name="check" size={17} strokeWidth={2.6} />}
          {busy === 'check' ? 'Checking…' : 'I’ve verified my email'}
        </button>
        {auth.isDemo && (
          <button
            className="btn btn-outline btn-block su-cta au-demo-btn"
            onClick={() => void demo()}
            disabled={!!busy}
          >
            {busy === 'demo' ? <span className="spinner" /> : <Icon name="spark" size={16} />}
            Demo: mark as verified
          </button>
        )}
        <div className="su-row">
          <button className="link" onClick={() => void other()}>
            Use a different email
          </button>
          <button className="link" disabled={wait > 0 || !!busy} onClick={() => void resend()}>
            {busy === 'resend'
              ? 'Sending…'
              : wait > 0
                ? `Resend in 0:${String(wait).padStart(2, '0')}`
                : 'Resend email'}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
