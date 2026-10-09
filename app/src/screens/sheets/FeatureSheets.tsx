import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, Icon, type IconName, RangeSlider, Toggle, useToast } from '@akaya/ui';
import { useApp } from '../../state/store';
import { AGENT_APPS } from '../../lib/agentApps';

type P = { open: boolean; onClose: () => void };

export function AgentsSheet({ open, onClose }: P) {
  const { state, toggleAgent, addAgent } = useApp();
  const nav = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [when, setWhen] = useState('Every day at 9:00 AM');
  return (
    <Sheet open={open} onClose={onClose} title="AI Agents" height={88}>
      <p className="muted rs-sub">Agents run routines for you, automatically.</p>
      <span className="label">Shopping & grocery</span>
      <div className="agent-apps">
        {AGENT_APPS.map((a) => (
          <button
            key={a.id}
            className="card agent-app"
            onClick={() => window.open(a.url, '_blank', 'noopener')}
            aria-label={`Open ${a.name}`}
          >
            <span className="aa-ic" style={{ background: a.grad }}>
              {a.emoji}
            </span>
            <b>{a.name}</b>
            <small>{a.desc}</small>
            <span className="aa-open">
              Open <Icon name="open" size={12} />
            </span>
          </button>
        ))}
      </div>
      <span className="label">Travel & deals</span>
      <div className="card list" style={{ margin: '0 0 14px' }}>
        {(
          [
            ['plane', 'cyan', 'Travel & Stays', 'Hotels, flights and things to do', '/travel'],
            ['bag', 'pink', 'Shopping & Deals', "Search any store, today's deals", '/shopping'],
          ] as const
        ).map(([icon, tone, title, sub, to]) => (
          <button key={to} className="list-row" onClick={() => nav(to)}>
            <span className={`gi gi-${tone}`} style={{ width: 36, height: 36, borderRadius: 12 }}>
              <Icon name={icon} size={18} />
            </span>
            <span className="grow">
              <b>{title}</b>
              <small>{sub}</small>
            </span>
            <Icon name="chev" size={16} className="faint" />
          </button>
        ))}
      </div>
      <span className="label">Routines</span>
      <div className="card list" style={{ margin: '0 0 14px' }}>
        {state.agents.map((a) => (
          <div key={a.id} className="list-row">
            <span className="gi gi-violet" style={{ width: 36, height: 36, borderRadius: 12 }}>
              <Icon name="agent" size={18} />
            </span>
            <span className="grow">
              <b>{a.name}</b>
              <small>{a.desc}</small>
            </span>
            <Toggle on={a.on} onChange={() => toggleAgent(a.id)} label={a.name} />
          </div>
        ))}
      </div>
      <span className="label">Create an agent</span>
      <input
        className="input"
        placeholder="e.g. Weekly expense summary"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select className="input" style={{ marginTop: 8 }} value={when} onChange={(e) => setWhen(e.target.value)}>
        {[
          'Every day at 9:00 AM',
          'Every Monday at 8:00 AM',
          'When a bill email arrives',
          'Every evening at 9:00 PM',
        ].map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <button
        className="btn btn-brand btn-block"
        style={{ marginTop: 10 }}
        disabled={!name.trim()}
        onClick={() => {
          addAgent(name.trim(), when);
          setName('');
          toast('Agent created and active', 'agent');
        }}
      >
        <Icon name="plus" size={17} /> Create agent
      </button>
    </Sheet>
  );
}

const PROMPTS: { cat: string; icon: IconName; tone: string; q: string }[] = [
  { cat: 'Write', icon: 'edit', tone: 'violet', q: 'Write a polite leave request for Friday' },
  { cat: 'Plan', icon: 'cal', tone: 'blue', q: 'Plan a 3-day Goa trip under ₹15k' },
  { cat: 'Translate', icon: 'translate', tone: 'green', q: 'Translate "See you tomorrow at 6" to Hindi' },
  { cat: 'Learn', icon: 'explore', tone: 'cyan', q: 'Explain mutual funds in simple words' },
  { cat: 'Summarise', icon: 'note', tone: 'orange', q: 'Summarise my day' },
  { cat: 'Remind', icon: 'alarm', tone: 'pink', q: 'Remind me to drink water every 2 hours' },
];
export function ExploreSheet({ open, onClose }: P) {
  const nav = useNavigate();
  return (
    <Sheet open={open} onClose={onClose} title="Explore" height={86}>
      <p className="muted rs-sub">Tap a prompt to try it in chat.</p>
      <div className="ex-grid">
        {PROMPTS.map((p) => (
          <button key={p.q} className="card ex-card" onClick={() => nav(`/chat?new=1&q=${encodeURIComponent(p.q)}`)}>
            <span className={`gi gi-${p.tone}`} style={{ width: 34, height: 34, borderRadius: 11 }}>
              <Icon name={p.icon} size={17} />
            </span>
            <small>{p.cat}</small>
            <b>{p.q}</b>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
export function LoanSheet({ open, onClose }: P) {
  const toast = useToast();
  const [amt, setAmt] = useState(100000);
  const [months, setMonths] = useState(12);
  const rate = 14; // illustrative annual rate
  const r = rate / 12 / 100;
  const emi = (amt * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  const total = emi * months;
  return (
    <Sheet open={open} onClose={onClose} title="Instant Loan" height={86}>
      <p className="muted rs-sub">Plan your EMI before you check offers.</p>
      <div className="loan-emi">
        <small>Estimated monthly EMI</small>
        <b>{inr(emi)}</b>
        <span>
          Total interest {inr(total - amt)} · {rate}% p.a. (illustrative)
        </span>
      </div>
      <div className="card loan-box">
        <RangeSlider
          label="Loan amount"
          value={amt}
          min={10000}
          max={500000}
          step={5000}
          onChange={setAmt}
          format={inr}
        />
        <div style={{ height: 18 }} />
        <RangeSlider
          label="Tenure"
          value={months}
          min={3}
          max={36}
          step={3}
          onChange={setMonths}
          format={(v) => `${v} months`}
        />
      </div>
      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 14 }}
        onClick={() => toast('Demo: partner offers appear here in the live app', 'loan')}
      >
        Check my offers <Icon name="chev" size={16} strokeWidth={2.6} />
      </button>
      <p className="faint loan-note">Final rate and eligibility are set by the lending partner.</p>
    </Sheet>
  );
}
