import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Screen } from '../components/Screen';
import { Logo } from '../components/Logo';
import { Pearl } from '../components/Pearl';
import { Icon } from '../components/Icon';
import { GoogleLogo } from '../components/GoogleLogo';
import { useApp } from '../state/store';
import './SignUp.css';

type Tab = 'phone' | 'email';

export function SignUp() {
  const { signIn } = useApp();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'start' | 'otp'>('start');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState<'google' | 'send' | 'verify' | null>(null);
  const [resendIn, setResendIn] = useState(30);
  const otpRef = useRef<HTMLInputElement>(null);

  const digits = phone.replace(/\D/g, '');
  const valid = tab === 'phone' ? digits.length === 10 : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const contact = tab === 'phone' ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : email.trim();

  useEffect(() => {
    if (step !== 'otp') return;
    otpRef.current?.focus();
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [step]);

  const done = (method: 'google' | 'phone' | 'email', c: string) => {
    signIn(method, c);
    nav('/onboarding', { replace: true });
  };

  const google = () => {
    setBusy('google');
    setTimeout(() => done('google', 'priya@example.com'), 900);
  };
  const sendOtp = () => {
    if (!valid) return;
    setBusy('send');
    setTimeout(() => {
      setBusy(null);
      setStep('otp');
      setResendIn(30);
    }, 700);
  };
  const verify = () => {
    if (otp.length !== 6) return;
    setBusy('verify');
    setTimeout(() => done(tab, contact), 800); // demo: any 6 digits are accepted
  };

  return (
    <Screen className="signup">
      <div className="su-top">
        <Logo size={25} />
        <small>Your intelligent assistant</small>
      </div>
      <div className="su-hero">
        <Pearl width={360} height={172} r={58} cx={166} cy={94} scene mood="happy" interactive label="Akaya says hi" />
        <motion.div
          className="su-say"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
        >
          Hi, I'm Akaya!
          <span>Your new AI buddy</span>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'start' ? (
          <motion.div
            key="start"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <h1 className="su-h1">Let's get you started</h1>
            <p className="su-sub">Chat, speak, translate and get things done.</p>
            <div className="su-form">
              <button className="btn btn-outline btn-block" onClick={google} disabled={!!busy}>
                {busy === 'google' ? <span className="spinner" /> : <GoogleLogo />}
                {busy === 'google' ? 'Signing in…' : 'Continue with Google'}
              </button>
              <div className="su-or">OR</div>
              <div className="su-tabs" role="tablist">
                {(['phone', 'email'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    className={tab === t ? 'on' : ''}
                    onClick={() => setTab(t)}
                  >
                    <Icon name={t === 'phone' ? 'phone' : 'mail'} size={15} />
                    {t === 'phone' ? 'Phone' : 'Email'}
                  </button>
                ))}
              </div>
              {tab === 'phone' ? (
                <label className="su-in">
                  <span className="cc">
                    <span className="flag" />
                    +91
                  </span>
                  <input
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    value={phone}
                    maxLength={11}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                    aria-label="Phone number"
                  />
                </label>
              ) : (
                <label className="su-in">
                  <Icon name="mail" size={18} className="faint" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                    aria-label="Email address"
                  />
                </label>
              )}
              <button className="btn btn-primary btn-block su-cta" disabled={!valid || !!busy} onClick={sendOtp}>
                {busy === 'send' ? <span className="spinner light" /> : null}
                Send OTP
                <Icon name="chev" size={16} strokeWidth={2.6} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
          >
            <h1 className="su-h1">Enter the code</h1>
            <p className="su-sub">
              We sent a 6-digit code to <b>{contact}</b>
            </p>
            <div className="su-form">
              <label className="otp" onClick={() => otpRef.current?.focus()}>
                <input
                  ref={otpRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  maxLength={6}
                  aria-label="One-time code"
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && verify()}
                />
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className={`box${i === otp.length ? ' cur' : ''}${otp[i] ? ' fill' : ''}`}>
                    {otp[i] ?? ''}
                  </span>
                ))}
              </label>
              <p className="su-hint">Demo: any 6 digits work.</p>
              <button
                className="btn btn-primary btn-block su-cta"
                disabled={otp.length !== 6 || !!busy}
                onClick={verify}
              >
                {busy === 'verify' ? (
                  <span className="spinner light" />
                ) : (
                  <Icon name="check" size={17} strokeWidth={2.6} />
                )}
                {busy === 'verify' ? 'Verifying…' : 'Verify & continue'}
              </button>
              <div className="su-row">
                <button
                  className="link"
                  onClick={() => {
                    setStep('start');
                    setOtp('');
                  }}
                >
                  Change {tab === 'phone' ? 'number' : 'email'}
                </button>
                <button className="link" disabled={resendIn > 0} onClick={() => setResendIn(30)}>
                  {resendIn > 0 ? `Resend in 0:${String(resendIn).padStart(2, '0')}` : 'Resend code'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="su-terms">
        By continuing, you agree to Akaya's <a href="#/signup">Terms of Service</a> and{' '}
        <a href="#/signup">Privacy Policy</a>.
      </p>
    </Screen>
  );
}
