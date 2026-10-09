import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Icon, type IconName, RangeSlider, Segmented, Toggle, Sheet, useToast } from '@akaya/ui';
import { Avatar } from '../components/Avatar';
import { useApp } from '../state/store';
import { speak } from '../lib/speech';
import type { ThemePref } from '../state/types';
import { AppTile } from '../components/AppTile';
import { APPS, connectedApps } from '../integrations/catalog';
import './More.css';

function Row({
  icon,
  tone,
  title,
  sub,
  right,
  onClick,
}: {
  icon: IconName;
  tone: string;
  title: string;
  sub?: string;
  right?: ReactNode;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className="list-row set-row" onClick={onClick}>
      <span className={`gi gi-${tone}`} style={{ width: 34, height: 34, borderRadius: 11 }}>
        <Icon name={icon} size={17} />
      </span>
      <span className="grow">
        <b>{title}</b>
        {sub && <small>{sub}</small>}
      </span>
      {right ?? (onClick && <Icon name="chev" size={16} className="faint" />)}
    </Tag>
  );
}

const LINKS: { icon: IconName; tone: string; label: string; to: string }[] = [
  { icon: 'search', tone: 'blue', label: 'Search', to: '/search' },
  { icon: 'history', tone: 'violet', label: 'History', to: '/history' },
  { icon: 'alarm', tone: 'orange', label: 'Reminders', to: '/reminders' },
  { icon: 'future', tone: 'blue', label: 'Future', to: '/future' },
  { icon: 'plane', tone: 'cyan', label: 'Travel', to: '/travel' },
  { icon: 'bag', tone: 'pink', label: 'Shopping', to: '/shopping' },
  { icon: 'crown', tone: 'violet', label: 'Upgrade', to: '/upgrade' },
  { icon: 'help', tone: 'green', label: 'Support', to: '/support' },
];

export function More() {
  const { state, setSetting, logout } = useApp();
  const s = state.settings;
  const nav = useNavigate();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const connected = connectedApps(state.integrations);

  return (
    <Screen className="more">
      <header className="more-head">
        <button className="icon-btn card" aria-label="Back to Home" onClick={() => nav('/home')}>
          <Icon name="back" size={20} />
        </button>
        <h2>More &amp; Settings</h2>
      </header>
      <div className="card profile">
        <Avatar size={54} />
        <div className="grow">
          <b>{state.user.name}</b>
          <small>{state.auth.contact ?? state.user.email}</small>
          <span className="tag t-violet">Free plan</span>
        </div>
      </div>
      <button className="upgrade-banner" onClick={() => nav('/upgrade')}>
        <Icon name="crown" size={22} />
        <span className="grow">
          <b>Upgrade Plan</b>
          <small>More agents, longer chats, priority Online mode</small>
        </span>
        <Icon name="chev" size={18} strokeWidth={2.4} />
      </button>
      <button className="card more-apps" onClick={() => nav('/apps')}>
        <span className="gi gi-blue" style={{ width: 44, height: 44, borderRadius: 14 }}>
          <Icon name="apps" size={22} />
        </span>
        <span className="grow">
          <b>Apps & Integrations</b>
          <small>
            {connected.length} connected · {APPS.length} apps
          </small>
        </span>
        <span className="ma-stack">
          {connected.slice(0, 3).map((app) => (
            <AppTile key={app.id} app={app} size={28} />
          ))}
        </span>
        <Icon name="chev" size={18} strokeWidth={2.4} className="faint" />
      </button>
      <div className="links">
        {LINKS.map((l) => (
          <button key={l.to} className="card link-tile" onClick={() => nav(l.to)}>
            <span className={`gi gi-${l.tone}`} style={{ width: 38, height: 38, borderRadius: 13 }}>
              <Icon name={l.icon} size={19} />
            </span>
            {l.label}
          </button>
        ))}
      </div>

      <h4 className="set-h">Appearance</h4>
      <div className="card set-card">
        <div className="set-block">
          <span className="set-label">Theme</span>
          <Segmented<ThemePref>
            className="full"
            value={s.theme}
            onChange={(v) => setSetting('theme', v)}
            options={[
              {
                value: 'light',
                label: (
                  <>
                    <Icon name="sun" size={14} />
                    Light
                  </>
                ),
              },
              {
                value: 'dark',
                label: (
                  <>
                    <Icon name="moon" size={14} />
                    Dark
                  </>
                ),
              },
              {
                value: 'system',
                label: (
                  <>
                    <Icon name="monitor" size={14} />
                    System
                  </>
                ),
              },
            ]}
          />
        </div>
        <div className="set-block">
          <RangeSlider
            label="Text size"
            value={s.textSize}
            min={0.9}
            max={1.2}
            step={0.05}
            onChange={(v) => setSetting('textSize', v)}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <p className="ts-preview">Aa · This is how text looks across Akaya.</p>
        </div>
      </div>

      <h4 className="set-h">Akaya AI</h4>
      <div className="card set-card">
        <div className="set-block">
          <span className="set-label">AI mode</span>
          <Segmented
            className="full"
            value={s.mode}
            onChange={(v) => setSetting('mode', v)}
            options={[
              {
                value: 'on-device',
                label: (
                  <>
                    <Icon name="chip" size={14} />
                    On-device
                  </>
                ),
              },
              {
                value: 'online',
                label: (
                  <>
                    <Icon name="globe" size={14} />
                    Online
                  </>
                ),
              },
            ]}
          />
          <small className="set-hint">
            {s.mode === 'on-device'
              ? 'Runs on your phone and works without internet.'
              : 'Uses cloud models for longer, richer answers.'}
          </small>
        </div>
        <div className="list">
          <Row
            icon="float"
            tone="orange"
            title="Floating bubble"
            sub="Show Akaya over other apps"
            right={<Toggle on={s.floating} onChange={(v) => setSetting('floating', v)} label="Floating bubble" />}
          />
          <Row
            icon="lang"
            tone="green"
            title="Language"
            sub="Replies, voice and translation default"
            right={
              <select
                className="mini-select"
                value={s.language}
                onChange={(e) => setSetting('language', e.target.value)}
                aria-label="Language"
              >
                {['English', 'Hindi', 'Tamil', 'Bengali', 'Marathi'].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            }
          />
        </div>
      </div>

      <h4 className="set-h">Voice</h4>
      <div className="card set-card">
        <div className="set-block">
          <RangeSlider
            label="Voice speed"
            value={s.voiceSpeed}
            min={0.75}
            max={1.5}
            step={0.05}
            onChange={(v) => setSetting('voiceSpeed', v)}
            format={(v) => `${v.toFixed(2)}×`}
          />
          <button
            className="btn btn-ghost btn-sm test-voice"
            onClick={() => speak("Hi Priya! This is how I'll sound.", s.voiceSpeed)}
          >
            <Icon name="volume" size={15} /> Test voice
          </button>
        </div>
      </div>

      <h4 className="set-h">Notifications</h4>
      <div className="card set-card">
        <div className="list">
          <Row
            icon="bell"
            tone="pink"
            title="Notifications"
            sub="Reminders, briefs and follow-ups"
            right={
              <Toggle on={s.notifications} onChange={(v) => setSetting('notifications', v)} label="Notifications" />
            }
          />
          <Row
            icon="alarm"
            tone="violet"
            title="Remind me before"
            sub="Default for new reminders"
            right={
              <select
                className="mini-select"
                value={s.reminderLead}
                onChange={(e) => setSetting('reminderLead', Number(e.target.value))}
                aria-label="Reminder lead time"
              >
                {[5, 10, 15, 30, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            }
          />
        </div>
      </div>

      <h4 className="set-h">Account</h4>
      <div className="card set-card">
        <div className="list">
          <Row icon="help" tone="green" title="Support" sub="FAQs and contact" onClick={() => nav('/support')} />
          <Row
            icon="chart"
            tone="blue"
            title="Earnings"
            sub="Affiliate clicks and commission (sample data)"
            onClick={() => nav('/earnings')}
          />
          <Row
            icon="logout"
            tone="orange"
            title="Log out"
            sub="Clears this device and returns to sign up"
            onClick={() => setConfirm(true)}
          />
        </div>
      </div>
      <p className="version faint">Akaya · Your intelligent assistant · v0.5.0</p>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Log out?" height={40}>
        <p className="muted" style={{ fontSize: '0.84rem', lineHeight: 1.5 }}>
          Your sample notes, chats and settings on this device will be reset.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirm(false)}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => {
              setConfirm(false);
              logout();
              toast('Logged out', 'logout');
              nav('/signup', { replace: true });
            }}
          >
            Log out
          </button>
        </div>
      </Sheet>
    </Screen>
  );
}
