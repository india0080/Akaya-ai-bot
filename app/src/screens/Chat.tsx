import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Pearl, Icon, useToast, Sheet } from '@akaya/ui';
import { useApp } from '../state/store';
import { mockReply } from '../lib/mock';
import { fmtTime, uid } from '../lib/time';
import { speak } from '../lib/speech';
import { AppTile } from '../components/AppTile';
import { ScreenState } from '../components/ScreenState';
import { requestMic, type MicBlock } from '../lib/mic';
import { useMicAccess } from '../lib/useMicAccess';
import { APP_BY_ID } from '../integrations/catalog';
import type { Attachment, ChatMode } from '../state/types';
import {
  SAMPLE_CONTACTS,
  generateImage,
  pickCamera,
  pickDocs,
  pickLocation,
  pickPhotos,
  pickScan,
  pickScreenshot,
  pickSystemContact,
} from '../chat/pickers';
import { replyWithAttachments } from '../chat/reply';
import { actionReply, detectLinkAction } from '../commerce/chatIntent';
import { LinkCard } from '../commerce/LinkCard';
import { draftFromText, isReminderRequest, ReminderChatCard, reminderReply, useReminders } from '../features/reminders';
import { AttachSheet, type PickKind } from './chat/AttachSheet';
import { ComposerChips, MessageAttachments } from './chat/Attachments';
import { useRecorder } from './chat/useRecorder';
import './Chat.css';
import './chat/Attach.css';

type Panel = null | 'menu' | 'apps' | 'notes' | 'contacts';

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
  const location = useLocation();
  const fromHome = (location.state as { from?: string } | null)?.from === 'home';
  const toast = useToast();
  const { state, newChat, addMessage } = useApp();
  const reminders = useReminders();
  const chat = id ? state.chats.find((c) => c.id === id) : undefined;
  const access = useMicAccess();
  const [micNote, setMicNote] = useState<MicBlock | null>(null);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [booting, setBooting] = useState(() => !!params.get('q'));
  const [atts, setAtts] = useState<Attachment[]>([]);
  const [modes, setModes] = useState<ChatMode[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(() => {
    const a = params.get('attach');
    return a === 'menu' || a === 'apps' || a === 'notes' ? a : null;
  });
  const taRef = useRef<HTMLTextAreaElement>(null);
  const connected = Object.values(state.integrations)
    .sort((a, b) => b.connectedAt - a.connectedAt)
    .map((c) => ({ app: APP_BY_ID[c.appId], conn: c }))
    .filter((x) => x.app);
  const focusInput = (delay = 350) => window.setTimeout(() => taRef.current?.focus(), delay);
  const fill = (t: string) => {
    setText(t);
    setPanel(null);
    focusInput();
  };
  const add = (list: Attachment[]) => {
    if (list.length) setAtts((a) => [...a, ...list].slice(0, 12));
  };
  const setMode = (m: ChatMode, on: boolean) =>
    setModes((ms) => (on ? [...new Set([...ms, m])] : ms.filter((x) => x !== m)));
  const rec = useRecorder(
    (a) => add([a]),
    (msg) => toast(msg, 'alert'),
  );
  const listRef = useRef<HTMLDivElement>(null);
  const sentQ = useRef(false);

  const send = (raw: string) => {
    const msg = raw.trim();
    if ((!msg && !atts.length) || typing) {
      setBooting(false);
      return;
    }
    let cid = chat?.id;
    const title = msg || atts[0]?.name || 'Attachment';
    if (!cid) {
      cid = newChat(title);
      nav(`/chat/${cid}`, { replace: true });
    }
    const sentAtts = atts;
    const sentModes = modes;
    addMessage(cid, 'me', msg, {
      attachments: sentAtts.length ? sentAtts : undefined,
      modes: sentModes.length ? sentModes : undefined,
    });
    setText('');
    setAtts([]);
    setModes((m) => m.filter((x) => x !== 'image'));
    setTyping(true);
    const target = cid;
    window.setTimeout(
      async () => {
        if (msg && isReminderRequest(msg)) {
          const { draft, title } = draftFromText(msg, state.settings.reminderLead, 'chat');
          if (!draft) reminders.compose({ text: msg, source: 'chat' });
          const res = draft ? await reminders.create(draft) : undefined;
          addMessage(target, 'akaya', reminderReply(msg, title, draft, res), {
            reminderId: res && res.outcome !== 'cancelled' ? res.id : undefined,
          });
          setTyping(false);
          return;
        }
        const action = detectLinkAction(msg) ?? undefined;
        const base = action ? actionReply(action) : mockReply(msg || title, state.settings.mode);
        const reply = replyWithAttachments(base, msg, sentAtts, sentModes);
        const gen = sentModes.includes('image') ? [generateImage(msg || 'Akaya')] : undefined;
        addMessage(target, 'akaya', reply, { attachments: gen, action });
        setTyping(false);
      },
      (sentModes.includes('deep') ? 1800 : 900) + Math.random() * 700,
    );
  };

  const pick = async (k: PickKind) => {
    if (k === 'apps' || k === 'notes') return setPanel(k);
    if (k === 'schedule') return nav('/future?edit=new');
    if (k === 'image') {
      setMode('image', !modes.includes('image'));
      setPanel(null);
      return focusInput();
    }
    setPanel(null);
    if (k === 'voice') return void rec.start();
    if (k === 'contact') {
      try {
        const sys = await pickSystemContact();
        if (sys === null) return setPanel('contacts');
        return add(sys);
      } catch {
        return setPanel('contacts');
      }
    }
    const run = {
      camera: pickCamera,
      photos: pickPhotos,
      files: pickDocs,
      scan: pickScan,
      screen: pickScreenshot,
      location: pickLocation,
    }[k];
    try {
      setBusy(k === 'location' ? 'Finding your location…' : 'Preparing preview…');
      add(await run());
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not attach that', 'alert');
    } finally {
      setBusy(null);
    }
  };

  // deep links: /chat?q=... sends, /chat?focus=1 focuses the composer (from Home)
  useEffect(() => {
    const q = params.get('q');
    if (q && !sentQ.current) {
      sentQ.current = true;
      setParams({}, { replace: true });
      send(q);
    }
    if (params.get('focus')) {
      taRef.current?.focus();
      if (Capacitor.isNativePlatform())
        void import('@capacitor/keyboard').then(({ Keyboard }) => Keyboard.show()).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const msgs = chat?.messages ?? [];
  const showBoot = booting && !msgs.length;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat?.messages.length, typing]);
  const canSend = !!text.trim() || atts.length > 0;
  return (
    <main className="screen chat-screen">
      <header className="chat-top">
        <button className="icon-btn card" aria-label="Back to Home" onClick={() => nav('/home')}>
          <Icon name="back" size={20} />
        </button>
        <motion.span
          className="chat-pearl"
          initial={fromHome ? { scale: 1.25, opacity: 0.6 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        >
          <Pearl width={44} height={44} r={16} shadow={false} glow={0.15} mood={typing ? 'thinking' : 'idle'} />
        </motion.span>
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
        {id && !chat ? (
          <ScreenState
            className="chat-mic-state"
            icon="chat"
            tone="violet"
            title="This chat isn’t here"
            body="It isn’t on this device. Start a new one and Akaya will keep it on this phone."
          >
            <div className="screen-state-actions">
              <button className="btn btn-brand btn-sm" onClick={() => nav('/chat')}>
                New chat
              </button>
            </div>
          </ScreenState>
        ) : showBoot ? (
          <ScreenState className="chat-mic-state" busy title="Sending that to Akaya…" body="The reply will show up in this chat." />
        ) : !msgs.length && (
          <motion.div
            className="chat-empty"
            initial={{ opacity: 0, y: fromHome ? 24 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: fromHome ? 0.08 : 0 }}
          >
            <Pearl width={220} height={170} r={50} scene interactive />
            <h2>
              Ask me <span className="grad-text">anything</span>
            </h2>
            <p className="muted">Chat, plan, translate, set reminders. Add photos, files or your location with +.</p>
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
              <div className={`msg-bub${m.attachments?.length ? ' has-att' : ''}`}>
                {m.modes && m.modes.length > 0 && (
                  <span className="msg-modes">
                    {m.modes.map((x) => (
                      <i key={x}>
                        <Icon name={x === 'web' ? 'globe' : x === 'deep' ? 'brain' : 'wand'} size={11} />
                        {x === 'web' ? 'Web' : x === 'deep' ? 'Deep think' : 'Image'}
                      </i>
                    ))}
                  </span>
                )}
                {m.attachments && m.attachments.length > 0 && <MessageAttachments items={m.attachments} />}
                {m.text}
                {m.action && <LinkCard action={m.action} />}
                {m.reminderId && <ReminderChatCard id={m.reminderId} />}
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
        {typing && msgs.length > 0 && (
          <div className="msg akaya" role="status" aria-label="Akaya is thinking">
            <div className="msg-bub typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
      </div>

      <motion.div
        className="composer"
        initial={fromHome ? { y: -18, opacity: 0.6 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      >
        {busy && (
          <div className="ax-busy" role="status">
            <i className="fm-spin" /> {busy}
          </div>
        )}
        {(rec.block || micNote) && (
          <ScreenState
            className="chat-mic-state"
            icon={(rec.block ?? micNote) === 'unsupported' ? 'mic' : 'alert'}
            title={(rec.block ?? micNote) === 'unsupported' ? 'Microphone isn’t available' : 'Microphone is blocked'}
            body={
              (rec.block ?? micNote) === 'unsupported'
                ? 'This browser or device has no microphone, so voice notes and Voice chat can’t start. You can still type.'
                : 'Allow the microphone for Akaya in your browser or system settings, then try again. You can keep typing in the meantime.'
            }
          >
            <div className="screen-state-actions">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  rec.clearBlock();
                  setMicNote(null);
                  focusInput();
                }}
              >
                Type instead
              </button>
              {(rec.block ?? micNote) === 'denied' && (
                <button
                  className="btn btn-brand btn-sm"
                  onClick={() => {
                    void (async () => {
                      const next = await requestMic();
                      if (next === 'ready') {
                        rec.clearBlock();
                        setMicNote(null);
                        nav('/voice');
                      } else setMicNote(next);
                    })();
                  }}
                >
                  Try again
                </button>
              )}
            </div>
          </ScreenState>
        )}
        <ComposerChips
          items={atts}
          modes={modes}
          onRemove={(x) => setAtts((a) => a.filter((y) => y.id !== x))}
          onMode={setMode}
        />
        {rec.recording ? (
          <div className="card comp-box ax-rec" role="status">
            <button className="ax-rec-x" onClick={() => rec.stop(false)} aria-label="Discard recording">
              <Icon name="trash" size={18} />
            </button>
            <span className="ax-rec-dot" />
            <span className="grow">
              Recording {Math.floor(rec.secs / 60)}:{String(rec.secs % 60).padStart(2, '0')}
            </span>
            <button className="comp-send" onClick={() => rec.stop(true)} aria-label="Stop and attach">
              <Icon name="check" size={18} strokeWidth={2.6} />
            </button>
          </div>
        ) : (
          <div className="card comp-box">
            <button
              className={`comp-plus${panel === 'menu' ? ' on' : ''}`}
              onClick={() => setPanel(panel === 'menu' ? null : 'menu')}
              aria-label="Add attachments"
            >
              <Icon name="plus" size={20} strokeWidth={2.4} />
            </button>
            <textarea
              ref={taRef}
              rows={1}
              placeholder={modes.includes('image') ? 'Describe the image to create…' : 'Ask Akaya anything…'}
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
            {canSend ? (
              <button className="comp-send" onClick={() => send(text)} aria-label="Send">
                <Icon name="send" size={18} />
              </button>
            ) : (
              <button
                className="comp-mic"
                onClick={() => {
                  if (access === 'checking') return;
                  if (access === 'denied' || access === 'unsupported') {
                    setMicNote(access);
                    return;
                  }
                  nav('/voice');
                }}
                disabled={access === 'checking'}
                aria-busy={access === 'checking'}
                aria-label={access === 'checking' ? 'Checking the microphone' : 'Talk instead'}
              >
                {access === 'checking' ? <span className="screen-state-spin" /> : <Icon name="mic" size={19} />}
              </button>
            )}
          </div>
        )}
      </motion.div>

      <AttachSheet
        open={panel === 'menu'}
        onClose={() => setPanel(null)}
        onPick={(k) => void pick(k)}
        modes={modes}
        onMode={setMode}
      />

      <Sheet open={panel === 'apps'} onClose={() => setPanel(null)} title="Ask your apps" height={78}>
        <p className="att-sub">Attach an app, or tap a prompt to add it to your message.</p>
        {connected.map(({ app }) => (
          <div key={app.id} className="att-app">
            <div className="att-app-h">
              <AppTile app={app} size={34} />
              <b>{app.name}</b>
              <button
                className="btn btn-ghost btn-sm att-attach"
                onClick={() => {
                  add([{ id: uid(), kind: 'app', name: app.name, meta: app.id }]);
                  setPanel(null);
                }}
              >
                <Icon name="clip" size={14} /> Attach
              </button>
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

      <Sheet open={panel === 'notes'} onClose={() => setPanel(null)} title="Smart Notes" height={70}>
        <p className="att-sub">Pick a note to attach.</p>
        {state.notes.map((n) => (
          <button
            key={n.id}
            className={`card att-note n-${n.color}`}
            onClick={() => {
              add([{ id: uid(), kind: 'note', name: n.text, meta: 'Smart Note' }]);
              setPanel(null);
              focusInput();
            }}
          >
            <Icon name="note" size={16} /> <span>{n.text}</span>
          </button>
        ))}
        {state.notes.length === 0 && <p className="att-sub">No notes yet.</p>}
      </Sheet>

      <Sheet open={panel === 'contacts'} onClose={() => setPanel(null)} title="Share a contact" height={62}>
        <p className="att-sub">Sample contacts (the system contact picker isn’t available in this view).</p>
        {SAMPLE_CONTACTS.map((c) => (
          <button
            key={c.name}
            className="card att-contact"
            onClick={() => {
              add([{ id: uid(), kind: 'contact', name: c.name, meta: c.tel }]);
              setPanel(null);
            }}
          >
            <span className="fm-av">{c.name[0]}</span>
            <span className="grow">
              <b>{c.name}</b>
              <small>{c.tel}</small>
            </span>
            <Icon name="plus" size={16} />
          </button>
        ))}
      </Sheet>
    </main>
  );
}
