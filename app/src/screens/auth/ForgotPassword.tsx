import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@akaya/ui';
import { auth, authMessage, emailError } from '../../auth';
import { Field, FormError } from './AuthBits';
import { AuthLayout } from './AuthLayout';

export function ForgotPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const eErr = emailError(email);

  const submit = async () => {
    setTouched(true);
    setErr(null);
    if (eErr || busy) return;
    setBusy(true);
    try {
      await auth.sendPasswordResetEmail(email);
      setSent(true);
    } catch (e) {
      setErr(authMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (sent)
    return (
      <AuthLayout
        icon="check"
        tone="green"
        back="/login"
        title="Check your email"
        sub={
          <>
            If an account exists for <b>{email.trim()}</b>, we’ve sent a link to reset your password.
          </>
        }
      >
        <div className="au-form">
          {auth.isDemo && <p className="su-hint">Demo mode: no email was sent.</p>}
          <button className="btn btn-primary btn-block su-cta" onClick={() => nav('/login', { replace: true })}>
            Back to log in
          </button>
          <p className="au-alt">
            Didn’t get it? Check spam, or{' '}
            <button type="button" className="link" onClick={() => setSent(false)}>
              try again
            </button>
          </p>
        </div>
      </AuthLayout>
    );

  return (
    <AuthLayout
      icon="lock"
      tone="orange"
      back="/login"
      title="Forgot password?"
      sub="Enter your email and we’ll send you a reset link."
    >
      <form
        className="au-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <FormError msg={err} />
        <Field
          icon="mail"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          error={touched ? eErr : null}
          onEnter={() => void submit()}
        />
        <button type="submit" className="btn btn-primary btn-block su-cta" disabled={busy}>
          {busy ? <span className="spinner light" /> : <Icon name="send" size={16} strokeWidth={2.2} />}
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  );
}
