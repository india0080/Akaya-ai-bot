import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Pearl } from '../components/Pearl';
import { Icon } from '../components/Icon';
import { useApp } from '../state/store';
import { mockReply } from '../lib/mock';
import { fmtTime } from '../lib/time';
import { speak } from '../lib/speech';
import { Sheet } from '../components/Sheet';
import { AppTile } from '../components/AppTile';
import { APP_BY_ID } from '../integrations/catalog';
import './Chat.css';

type Attach = null | 'menu' | 'apps' | 'notes';

const SUGGEST = [
  'Plan my weekend',
  'Remind me to call Rahul at 5',
  'Translate "Thank you so much!" to Hindi',
  'Summarise my day',
];

export function Chat() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const { state, newChat, addMessage } = useApp();
  const chat = id ? state.chats.find((c) => c.id === id) : undefined;
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [attach, setAttach] = useState<Attach>(() => {
    const a = params.get('attach');
    return a === 'menu' || a === 'apps' || a === 'notes' ? a : null;
  });
  const taRef = useRef<HTMLTextAreaElement>(null);
  const connected = Object.values(state.integrations)
    .sort((a, b) => b.connectedAt - a.connectedAt)
    .map((c) => ({ app: APP_BY_ID[c.appId], conn: c }))
    .filter((x) => x.app);
  const fill = (t: string) => {
    setText(t);
    setAttach(null);
    window.setTimeout(() => taRef.current?.focus(), 350);
  };
  const listRef = useRef<HTMLDivElement>(null);
  const sentQ = useRef(false);

  const send = (raw: string) => {
    const msg = raw.trim();
    if (!msg || typing) return;
    let cid = chat?.id;
    if (!cid) {
      cid = newChat(msg);
      nav(`/chat/${cid}`, { replace: true });
    }
    addMessage(cid, 'me', msg);
    setText('');
    setTyping(true);
    const target = cid;
    window.setTimeout(
      () => {
        addMessage(target, 'akaya', mockReply(msg, state.settings.mode));
        setTyping(false);
      },
      900 + Math.random() * 700,
    );
  };

  // deep links: /chat?new=1&q=...
  useEffect(() => {
    const q = params.get('q');
    if (q && !sentQ.current) {
      sentQ.current = true;
      setParams({}, { replace: true });
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat?.messages.length, typing]);

  const msgs = chat?.messages ?? [];
  return (
    <main className="screen with-nav chat-screen">
      <header className="chat-top">
        <Pearl width={44} height={44} r={16} shadow={false} glow={0.15} mood={typing ? 'thinking' : 'idle'} />
        <div className="grow">
          <b>{chat && msgs.length ? chat.title : 'Ask Akaya'}</b>
          <small>
            <em className={`live${state.settings.mode === 'on-device' ? ' on' : ''}`} />
            {typing ? 'Akaya is thinking…' : state.settings.mode === 'on-device' ? 'On-device AI' : 'Online'}
          </small>
        </div>
        <button className="icon-btn card" aria-label="History" onClick={() => nav('/history?f=chat')}>
          <Icon name="history" size={19} />
        </button>
        <button className="icon-btn card" aria-label="New chat" onClick={() => nav('/chat')}>
          <Icon name="plus" size={20} />
        </button>
      </header>

      <div className="chat-list" ref={listRef}>
        {!msgs.length && (
          <motion.div className="chat-empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Pearl width={220} height={170} r={50} scene interactive />
            <h2>
              Ask me <span className="grad-text">anything</span>
            </h2>
            <p className="muted">Chat, plan, translate, set reminders. I'm all ears.</p>
            <div className="chat-sugg">
              {SUGGEST.map((s) => (
                <button key={s} className="card" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        <AnimatePresence initial={false}>
          {msgs.map((m) => (
            <motion.div
              key={m.id}
              className={`msg ${m.from}`}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
            >
              <div className="msg-bub">
                {m.text}
                <span className="msg-meta">
                  {fmtTime(m.at)}
                  {m.from === 'akaya' && (
                    <button aria-label="Read aloud" onClick={() => speak(m.text, state.settings.voiceSpeed)}>
                      <Icon name="volume" size={13} />
                    </button>
                  )}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <div className="msg akaya">
            <div className="msg-bub typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
      </div>

      <div className="composer">
        <AnimatePresence>
          {attach === 'menu' && (
            <>
              <motion.div
                className="att-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAttach(null)}
              />
              <motion.div
                className="card att-menu"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              >
                <button className="att-item" onClick={() => setAttach('apps')}>
                  <span className="gi gi-blue">
                    <Icon name="apps" size={18} />
                  </span>
                  <span className="grow">
                    <b>Apps</b>
                    <small>{connected.length} connected · ask about your apps</small>
                  </span>
                </button>
                <button className="att-item" onClick={() => setAttach('notes')}>
                  <span className="gi gi-violet">
                    <Icon name="note" size={18} />
                  </span>
                  <span className="grow">
                    <b>Smart Notes</b>
                    <small>Add a note to your message</small>
                  </span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <div className="card comp-box">
          <button
            className={`comp-plus${attach === 'menu' ? ' on' : ''}`}
            onClick={() => setAttach(attach === 'menu' ? null : 'menu')}
            aria-label="Attach"
          >
            <Icon name="plus" size={20} strokeWidth={2.4} />
          </button>
          <textarea
            ref={taRef}
            rows={1}
            placeholder="Message Akaya…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(text);
              }
            }}
            aria-label="Message"
          />
          {text.trim() ? (
            <button className="comp-send" onClick={() => send(text)} aria-label="Send">
              <Icon name="send" size={18} />
            </button>
          ) : (
            <button className="comp-mic" onClick={() => nav('/voice')} aria-label="Talk instead">
              <Icon name="mic" size={19} />
            </button>
          )}
        </div>
      </div>

      <Sheet open={attach === 'apps'} onClose={() => setAttach(null)} title="Ask your apps" height={78}>
        <p className="att-sub">Tap a prompt to add it to your message.</p>
        {connected.map(({ app }) => (
          <div key={app.id} className="att-app">
            <div className="att-app-h">
              <AppTile app={app} size={34} />
              <b>{app.name}</b>
            </div>
            <div className="att-prompts">
              {app.abilities.map((a) => (
                <button key={a.key} className="att-prompt" onClick={() => fill(a.prompt)}>
                  {a.prompt}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button className="btn btn-ghost att-more" onClick={() => nav('/apps')}>
          <Icon name="plus" size={17} strokeWidth={2.4} /> Connect more apps
        </button>
      </Sheet>

      <Sheet open={attach === 'notes'} onClose={() => setAttach(null)} title="Smart Notes" height={70}>
        <p className="att-sub">Pick a note to include.</p>
        {state.notes.map((n) => (
          <button
            key={n.id}
            className={`card att-note n-${n.color}`}
            onClick={() => fill(`Help me with this note: "${n.text}"`)}
          >
            <Icon name="note" size={16} /> <span>{n.text}</span>
          </button>
        ))}
        {state.notes.length === 0 && <p className="att-sub">No notes yet.</p>}
      </Sheet>
    </main>
  );
}
