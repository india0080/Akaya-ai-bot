/** Sample data and mock AI behaviour. Replace with real APIs in production. */
import type { AppState, ChatMessage } from '../state/types';
import { uid } from './time';
import { sampleReminders } from '../features/reminders/sample';
import { APPS } from '../integrations/catalog';
import { buildNotes } from '../notes/mockProvider';
import { SEED_CALCULUS, SEED_IDEAS, SEED_SALES, toSegments, type ScriptLine } from '../notes/scripts';
import type { NoteMeta, VoiceNote } from '../notes/types';

const today = (h: number, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
};
const daysAgo = (n: number, h = 10, m = 0) => today(h, m) - n * 86400000;

export const SAMPLE_CHATS: AppState['chats'] = [
  {
    id: 'c-goa',
    title: 'Goa trip plan',
    updatedAt: today(10, 24),
    messages: [
      { id: uid(), from: 'me', text: 'Plan a 3-day Goa trip with beach stays under ₹15k', at: today(10, 22) },
      {
        id: uid(),
        from: 'akaya',
        text: 'Here is a relaxed 3-day plan:\n• Day 1: North Goa: Baga & Anjuna, sunset at Chapora Fort\n• Day 2: Old Goa churches, Fontainhas walk, Panjim food trail\n• Day 3: South Goa: Palolem beach & kayaking\nStays: beach huts in Palolem and guesthouses in Anjuna fit your budget.',
        at: today(10, 24),
      },
    ],
  },
  {
    id: 'c-neha',
    title: 'Reply to Neha · Hindi → English',
    updatedAt: daysAgo(1, 18, 5),
    messages: [
      { id: uid(), from: 'me', text: 'हाँ, कल 6 बजे मिलते हैं — translate to English', at: daysAgo(1, 18, 4) },
      { id: uid(), from: 'akaya', text: 'Sure, see you at 6 tomorrow!', at: daysAgo(1, 18, 5) },
    ],
  },
  {
    id: 'c-grocery',
    title: 'Weekly grocery list',
    updatedAt: daysAgo(4, 9, 15),
    messages: [
      { id: uid(), from: 'me', text: 'Make my weekly grocery list', at: daysAgo(4, 9, 14) },
      {
        id: uid(),
        from: 'akaya',
        text: 'Milk, eggs, atta, tomatoes, onions, coffee, bananas and paneer. Want me to save it as a Smart Note?',
        at: daysAgo(4, 9, 15),
      },
    ],
  },
];

function sampleNote(
  id: string,
  meta: NoteMeta,
  lines: ScriptLine[],
  createdAt: number,
  duration: number,
  size: number,
): VoiceNote {
  const segments = toSegments(lines, id);
  return {
    id,
    ...meta,
    lang: 'en-IN',
    createdAt,
    duration,
    segments,
    bookmarks: [],
    notes: buildNotes(segments, meta),
    audio: false,
    size,
    sample: true,
  };
}

/** Seed recordings (transcript + notes only; sample notes carry no audio). */
const SAMPLE_VOICE_NOTES = (): VoiceNote[] => [
  sampleNote(
    'vn-calc',
    { title: 'Calculus – Derivatives', mode: 'lecture', subject: 'Mathematics', level: 'College' },
    SEED_CALCULUS,
    daysAgo(1, 11, 15),
    1712,
    1_400_000,
  ),
  sampleNote(
    'vn-sales',
    { title: 'Weekly sales sync', mode: 'business', subject: 'Sales' },
    SEED_SALES,
    daysAgo(2, 14, 45),
    1240,
    1_100_000,
  ),
  sampleNote(
    'vn-diwali',
    { title: 'Diwali campaign ideas', mode: 'ideas', subject: 'Marketing' },
    SEED_IDEAS,
    daysAgo(3, 9, 30),
    312,
    280_000,
  ),
];

export function initialState(): AppState {
  return {
    version: 1,
    auth: { signedIn: false },
    onboardingDone: false,
    user: { name: 'Priya', email: 'priya@example.com', phone: '+91 98765 43210' },
    settings: {
      theme: 'system',
      mode: 'on-device',
      floating: true,
      notifications: true,
      language: 'English',
      reminderLead: 10,
      autoFollowUp: false,
      voiceSpeed: 1,
      textSize: 1,
    },
    today: [
      {
        id: 't4',
        kind: 'calendar',
        title: 'Team sync',
        time: today(11, 30),
        done: false,
        createdAt: daysAgo(2, 18, 0),
      },
      {
        id: 't5',
        kind: 'calendar',
        title: 'Dinner with Neha',
        time: today(20, 30),
        done: false,
        createdAt: daysAgo(1, 21, 30),
      },
      {
        id: 't6',
        kind: 'followup',
        title: 'Reply to Neha about Friday',
        time: today(12),
        done: false,
        createdAt: today(9, 2),
      },
      {
        id: 't7',
        kind: 'followup',
        title: 'Send invoice to Rahul',
        time: today(16),
        done: false,
        createdAt: daysAgo(1, 16, 20),
      },
    ],
    reminders: sampleReminders(),
    notes: [
      {
        id: 'n1',
        text: 'Gift ideas for Neha: scented candles, a planner, the novel she mentioned',
        createdAt: daysAgo(2),
        color: 'violet',
      },
      { id: 'n2', text: 'Wi-Fi password for the studio: akaya-guest-2026', createdAt: daysAgo(5), color: 'blue' },
    ],
    // sample Future Messages (ids start with "sample-" so the UI can label them)
    future: [
      {
        id: 'sample-f1',
        to: 'Neha',
        text: 'Happy birthday, Neha! Wishing you a year full of laughter and big wins 🎉',
        when: today(23, 59) + 60000,
        status: 'scheduled',
        createdAt: daysAgo(1, 22, 15),
        channels: ['whatsapp'],
        repeat: 'yearly',
        tz: 'Asia/Kolkata',
      },
      {
        id: 'sample-f2',
        to: 'My account',
        text: 'Akaya now schedules messages and posts across 20 channels. Write once, send at the right time.',
        when: today(24 + 10, 0),
        status: 'scheduled',
        createdAt: daysAgo(0, 9, 40),
        channels: ['linkedin', 'x'],
        repeat: 'once',
        tz: 'Asia/Kolkata',
      },
      {
        id: 'sample-f3',
        to: 'Rahul',
        subject: 'Invoice reminder',
        text: 'Hi Rahul, a gentle reminder that the invoice for September is due on Friday. Thanks!',
        when: daysAgo(1, 18),
        sentAt: daysAgo(1, 18),
        status: 'sent',
        results: { gmail: 'sent' },
        createdAt: daysAgo(2, 11),
        channels: ['gmail'],
        repeat: 'once',
        tz: 'Asia/Kolkata',
        attempts: 1,
      },
    ],
    chats: SAMPLE_CHATS,
    notifications: [
      {
        id: 'x1',
        title: 'Reminder in 30 min',
        body: 'Call Rahul at 5:00 PM',
        at: today(9, 30),
        read: false,
        icon: 'alarm',
      },
      {
        id: 'x2',
        title: 'Morning brief is ready',
        body: '2 meetings, 3 reminders and 1 follow-up today',
        at: today(8),
        read: false,
        icon: 'agent',
      },
      {
        id: 'x3',
        title: 'Future Message scheduled',
        body: 'Birthday wish to Neha sends at 12:00 AM',
        at: daysAgo(1, 21),
        read: true,
        icon: 'future',
      },
    ],
    activity: SAMPLE_ACTIVITY,
    integrations: {
      gmail: {
        appId: 'gmail',
        connectedAt: daysAgo(6, 10, 12),
        account: 'priya@example.com',
        toggles: { summarize: true, draft: true, floating: true },
      },
      'google-calendar': {
        appId: 'google-calendar',
        connectedAt: daysAgo(6, 10, 14),
        account: 'priya@example.com',
        toggles: { agenda: true, schedule: true, conflicts: false },
      },
      'whatsapp-business': {
        appId: 'whatsapp-business',
        connectedAt: daysAgo(2, 15, 40),
        account: 'Business number +91 98765 43210',
        toggles: { clicktochat: true, templates: true, translate: true },
      },
    },
    voiceNotes: SAMPLE_VOICE_NOTES(),
    history: { pinned: [], hidden: [] },
    agents: [
      { id: 'a1', name: 'Morning brief', desc: 'Every day at 8:00 AM · mails & calendar', on: true },
      { id: 'a2', name: 'Bill reminders', desc: 'Nudges 2 days before due dates', on: true },
      { id: 'a3', name: 'Follow-up nudges', desc: 'Reminds you of unanswered chats', on: false },
      { id: 'a4', name: 'Daily notes digest', desc: 'Evening summary of your Smart Notes', on: false },
    ],
  };
}

export const SAMPLE_ACTIVITY: AppState['activity'] = [
  {
    id: 'v1',
    kind: 'voice',
    title: 'Voice Chat',
    input: "What's on my schedule today?",
    output: 'You have Team sync at 11:30 AM, a call with Rahul at 5 PM and dinner with Neha at 8:30 PM.',
    at: today(9, 15),
  },
  {
    id: 'f1',
    kind: 'floating',
    app: 'WhatsApp',
    title: 'Reply to Rahul',
    input: 'हाँ, 4 बजे ठीक है। तब बात करते हैं।',
    output: 'Sure, 4 PM works for me. Talk then!',
    at: today(8, 52),
  },
  {
    id: 'tr1',
    kind: 'translation',
    title: 'Translate to Hindi',
    langs: 'English → Hindi',
    input: 'Dreams are not what you see in sleep, they are the ones that do not let you sleep.',
    output: 'सपने वो नहीं जो आप सोते समय देखते हैं, सपने वो हैं जो आपको सोने नहीं देते।',
    at: today(8, 45),
  },
  {
    id: 'f2',
    kind: 'floating',
    app: 'Gmail',
    title: 'Reply to Neha',
    input: 'Reply politely that I will share the deck by Friday',
    output: 'Hi Neha, thanks for the reminder! I will share the final deck by Friday. Best, Priya',
    at: daysAgo(1, 21, 10),
  },
  {
    id: 'tr2',
    kind: 'translation',
    title: 'Translate to English',
    langs: 'Hindi → English',
    input: 'जीवन में सफल होना है तो निरंतर सीखते रहो।',
    output: 'If you want to succeed in life, keep learning constantly.',
    at: daysAgo(1, 18, 30),
  },
  {
    id: 'v2',
    kind: 'voice',
    title: 'Voice Chat',
    input: 'Set a reminder tomorrow at 7 AM for the gym',
    output: 'Done! I will remind you tomorrow at 7:00 AM: Gym.',
    at: daysAgo(1, 17, 10),
  },
  {
    id: 'f3',
    kind: 'floating',
    app: 'WhatsApp',
    title: 'Wishes for Neha',
    input: 'Tell her happy anniversary in Hindi',
    output: 'सालगिरह की बहुत-बहुत शुभकामनाएँ, नेहा! 🎉',
    at: daysAgo(3, 20, 5),
  },
];

/* ---------------- mock assistant ---------------- */
export function mockReply(input: string, mode: 'on-device' | 'online'): string {
  const q = input.toLowerCase();
  if (/gmail|inbox|unread .*email/.test(q))
    return 'From Gmail (sample): 3 unread. Rahul asks to approve the ₹48,200 invoice, Neha confirms Friday 6 PM, and Razorpay sent a settlement report. Want me to draft replies?';
  if (/notion/.test(q))
    return 'From Notion (sample): "Q4 roadmap" has 3 goals: launch Floating reply in 5 more languages, Agents beta for teams, and a faster on-device model. 2 tasks are due this week. Shall I add them to Today?';
  if (/slack|teams/.test(q))
    return 'Catch-up (sample): #launch decided the release is on Monday; Rahul needs the final deck; 4 threads mention you. Want a reply drafted for Rahul?';
  if (/razorpay|payment|tally|invoice/.test(q))
    return 'Payments (sample): ₹1,24,500 collected today across 38 payments, 2 failed (₹3,200). Tally shows ₹56,000 outstanding from 4 customers. Want reminders sent as drafts?';
  const app = APPS.find((x) => q.includes(x.name.toLowerCase()));
  if (app)
    return `Here's what I found in ${app.name} (sample data): everything looks up to date. I can ${app.abilities[0].label.toLowerCase()}. Shall I go ahead?`;
  const tail = mode === 'on-device' ? '' : '';
  if (/remind|reminder|याद/.test(q))
    return `Done! I've added a reminder: "${input.replace(/remind me (to )?/i, '')}". I'll nudge you on time.${tail}`;
  if (/translate|hindi|english|अनुवाद/.test(q))
    return 'Here you go: "See you tomorrow at 6, I\'ll bring the documents." Want me to copy it or send it?';
  if (/trip|travel|goa|plan/.test(q))
    return 'Here is a quick plan: Day 1 explore the old town, Day 2 beaches and a sunset cruise, Day 3 local food trail. Shall I add these to your calendar?';
  if (/note|save/.test(q)) return 'Saved it as a Smart Note. You can find it under Home → Smart Note.';
  if (/weather/.test(q))
    return 'It looks pleasant today, around 29°C with a light breeze in the evening. Carry water if you are heading out!';
  if (/hi|hello|hey|namaste|नमस्ते/.test(q))
    return 'Hi Priya! 👋 I can chat, set reminders, translate in 99+ languages, read your screen and schedule messages. What shall we do?';
  if (/summar|brief/.test(q))
    return 'Summary: 2 meetings today (Team sync 11:30 AM, Dinner with Neha 8:30 PM), 3 reminders and 2 follow-ups pending.';
  return `Got it! Here's a thought on "${input.slice(0, 60)}": I'd start by breaking it into 3 small steps. Want me to set a reminder for the first one?`;
}

export function chatTitle(first: string): string {
  const t = first.replace(/\s+/g, ' ').trim();
  return t.length > 32 ? t.slice(0, 30) + '…' : t || 'New chat';
}

export const newMsg = (from: ChatMessage['from'], text: string): ChatMessage => ({
  id: uid(),
  from,
  text,
  at: Date.now(),
});

/* ---------------- translation demo ---------------- */
export const LANGS = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
];

type Phrase = Record<string, string>;
export const PHRASES: Phrase[] = [
  {
    en: 'How are you? Let’s meet tomorrow.',
    hi: 'आप कैसे हैं? चलो कल मिलते हैं।',
    ta: 'நீங்கள் எப்படி இருக்கிறீர்கள்? நாளை சந்திப்போம்.',
    bn: 'আপনি কেমন আছেন? চলুন কাল দেখা করি।',
    mr: 'तुम्ही कसे आहात? उद्या भेटूया.',
    es: '¿Cómo estás? Nos vemos mañana.',
    fr: 'Comment ça va ? On se voit demain.',
    ja: 'お元気ですか？明日会いましょう。',
    ar: 'كيف حالك؟ لنلتقِ غدًا.',
  },
  {
    en: 'Thank you so much!',
    hi: 'बहुत-बहुत धन्यवाद!',
    ta: 'மிக்க நன்றி!',
    bn: 'অনেক ধন্যবাদ!',
    mr: 'खूप खूप धन्यवाद!',
    es: '¡Muchas gracias!',
    fr: 'Merci beaucoup !',
    ja: '本当にありがとう！',
    ar: 'شكرًا جزيلًا!',
  },
  {
    en: 'Where is the nearest metro station?',
    hi: 'सबसे नज़दीकी मेट्रो स्टेशन कहाँ है?',
    ta: 'அருகிலுள்ள மெட்ரோ நிலையம் எங்கே?',
    bn: 'সবচেয়ে কাছের মেট্রো স্টেশন কোথায়?',
    mr: 'सर्वात जवळचे मेट्रो स्टेशन कुठे आहे?',
    es: '¿Dónde está la estación de metro más cercana?',
    fr: 'Où est la station de métro la plus proche ?',
    ja: '一番近い地下鉄の駅はどこですか？',
    ar: 'أين أقرب محطة مترو؟',
  },
  {
    en: 'Sure, 4 PM works for me. Talk then!',
    hi: 'हाँ, 4 बजे ठीक है। तब बात करते हैं!',
    ta: 'சரி, மாலை 4 மணி எனக்கு ஓகே. அப்போது பேசலாம்!',
    bn: 'হ্যাঁ, বিকেল ৪টা ঠিক আছে। তখন কথা হবে!',
    mr: 'हो, ४ वाजता चालेल. तेव्हा बोलूया!',
    es: 'Claro, a las 4 me va bien. ¡Hablamos!',
    fr: 'Bien sûr, 16 h me convient. À tout à l’heure !',
    ja: 'はい、4時で大丈夫です。その時に話しましょう！',
    ar: 'بالتأكيد، الساعة 4 تناسبني. نتحدث حينها!',
  },
];

/** Looks the text up in the sample phrasebook (any language). Returns null when unknown (demo only). */
export function translate(text: string, to: string): string | null {
  const norm = (v: string) =>
    v
      .trim()
      .toLowerCase()
      .replace(/[.!?।…’'"]+/g, '')
      .replace(/\s+/g, ' ');
  const t = norm(text);
  if (!t) return '';
  const hit = PHRASES.find((p) => Object.values(p).some((v) => norm(v) === t));
  return hit ? hit[to] : null;
}
