import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { useApp } from '../state/store';
import { fmtDate, fmtTime, untilText } from '../lib/time';
import './Features.css';

const CONTACTS = ['Neha', 'Rahul', 'Mom', 'Team'];
const pad = (n: number) => String(n).padStart(2, '0');
const tomorrow = () => {
  const d = new Date(Date.now() + 86400000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function FutureMessages() {
  const { state, scheduleMessage, cancelMessage } = useApp();
  const toast = useToast();
  const [to, setTo] = useState('Neha');
  const [text, setText] = useState('');
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState('09:00');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  const when = new Date(`${date}T${time}`).getTime();
  const valid = text.trim().length > 0 && to.trim().length > 0 && when > now;

  return (
    <Screen className="feature">
      <ScreenHeader title="Future Message" sub="Write now, send later" />
      <div className="card fm-form">
        <span className="label">To</span>
        <div className="fm-contacts">
          {CONTACTS.map((c) => (
            <button key={c} className={`fm-c${to === c ? ' on' : ''}`} onClick={() => setTo(c)}>
              <span className="fm-av">{c[0]}</span>
              {c}
            </button>
          ))}
        </div>
        <span className="label" style={{ marginTop: 14 }}>
          Message
        </span>
        <textarea
          className="input"
          placeholder={`Write something for ${to}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <div className="fm-when">
          <label>
            <span className="label">Date</span>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <span className="label">Time</span>
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        {!Number.isNaN(when) && when <= now && <p className="fm-err">Pick a time in the future.</p>}
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 14 }}
          disabled={!valid}
          onClick={() => {
            scheduleMessage({ to, text: text.trim(), when });
            setText('');
            toast(`Scheduled for ${fmtDate(when)}, ${fmtTime(when)}`, 'future');
          }}
        >
          <Icon name="send" size={16} /> Schedule send
        </button>
      </div>

      <div className="sec-head">
        <h3>Scheduled</h3>
        <span className="faint" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
          {state.future.length}
        </span>
      </div>
      <div className="fm-list">
        <AnimatePresence initial={false}>
          {state.future.map((m) => {
            const sent = m.when <= now;
            return (
              <motion.div
                key={m.id}
                layout
                className="card fm-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -60 }}
              >
                <div className="fm-top">
                  <span className="fm-av big">{m.to[0]}</span>
                  <div className="grow">
                    <b>{m.to}</b>
                    <small>
                      {fmtDate(m.when)} · {fmtTime(m.when)}
                    </small>
                  </div>
                  <span className={`tag ${sent ? 't-green' : 't-orange'}`}>{sent ? 'Sent ✓' : untilText(m.when)}</span>
                </div>
                <p>{m.text}</p>
                {!sent && (
                  <button className="link fm-cancel" onClick={() => cancelMessage(m.id)}>
                    Cancel
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!state.future.length && <div className="empty">No messages scheduled yet.</div>}
      </div>
    </Screen>
  );
}
