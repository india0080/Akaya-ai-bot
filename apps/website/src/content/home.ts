import type { PageContent } from './types';

/** Homepage copy (from akaya-voice-flow), laid out in the approved redesign. */
const home: PageContent = {
  key: 'home',
  kind: 'home',
  path: '/',
  bubble: 'pearl',
  seo: {
    title: 'Akaya AI – Personal AI Assistant | Online & Offline AI',
    description:
      'Akaya AI is your personal AI assistant for chat, voice, PDF reading, translation, web search, automation and more. Use powerful online AI or supported offline AI with an advanced floating assistant.',
    keywords: ['ai assistant app', 'personal ai assistant', 'voice ai assistant', 'offline ai assistant', 'ai assistant app india', 'floating ai assistant', 'pdf ai reader', 'ai translator 99 languages'],
    path: '/',
    hreflang: { en: '/', 'en-US': '/', 'en-IN': '/ai-assistant-india', 'en-CA': '/ai-assistant-canada', 'x-default': '/' },
  },
  hero: {
    id: 'hero',
    eyebrow: 'AI Personal Assistant',
    heading: 'More Than Just Chat.',
    body: [
      'Your AI Companion. Everywhere.',
      'Akaya brings chat, voice, offline AI, web search, translation, document intelligence and everyday actions into one powerful personal assistant.',
    ],
    bullets: ['Online + Offline AI', '99+ Languages', 'Floating Assistant'],
    screens: ['01-home-today'],
    ctas: [
      { label: 'Sign up free', href: '/signup', primary: true },
      { label: 'See How Akaya Works →', href: '/overview' },
    ],
  },
  sections: [
    {
      id: 'two-worlds', eyebrow: 'Online + Offline', heading: 'One Assistant. Two Worlds.', visual: 'gradient-pair',
      body: ['Powerful online intelligence. Private on-device assistance.'],
      items: [
        { title: 'Online AI', text: 'When you need advanced intelligence, Akaya can connect to powerful online AI models.', bubble: 'blue' },
        { title: 'Offline AI', text: 'When the internet is unavailable, supported features can continue using on-device AI.', bubble: 'green' },
      ],
      bullets: ['Advanced reasoning', 'Web search', 'Latest information', 'Complex tasks', 'Document analysis', 'Coding & writing', 'AI generation', '|', 'Works without internet', 'On-device processing', 'Fast responses', 'Privacy-focused', 'Local voice capabilities', 'Reduced cloud dependency'],
    },
    {
      id: 'floating', eyebrow: 'Floating Assistant', heading: 'AI That Follows You.', visual: 'split-phones',
      body: ['Akaya can appear over supported apps so you can use AI without constantly switching between applications.', 'Meet the Akaya Floating Assistant. Speak naturally. Akaya writes, translates and helps you respond.'],
      items: [{ title: 'You speak' }, { title: 'Akaya understands' }, { title: 'AI improves or translates' }, { title: 'Text appears' }, { title: 'Insert into the current app' }],
      screens: ['51-chat-hindi-hinglish', '50-chat-reminder'],
    },
    {
      id: 'voice', eyebrow: 'Voice', heading: 'Just Speak. Akaya Understands.', visual: 'split-phones', bubble: 'violet',
      body: ['Use your voice to ask questions, write messages, translate text, create tasks and interact with Akaya naturally.'],
      bullets: ['“Read this screen.”', '“Translate this into Hindi.”', '“Reply to this message.”', '“Summarize this PDF.”', '“Set a reminder for tomorrow.”'],
      screens: ['25-composer-voice'],
    },
    {
      id: 'chat', eyebrow: 'Chat', heading: 'Your AI Chat Assistant.', visual: 'split-phones',
      body: ['Ask questions, research ideas, write, code, plan trips, summarize information and solve everyday problems.'],
      bullets: ['Plan a 3-day Jaipur trip under $250 and write the hotel email.', 'Ask Anything', 'Web Search', 'Writing', 'Translation', 'Planning', 'Summarize'],
      screens: ['61-shopping', '05-reminders-today-only'],
    },
    {
      id: 'documents', eyebrow: 'Documents', heading: 'Ask Your Documents Anything.', visual: 'card-list',
      body: ['Upload a PDF or document and let Akaya read, summarize and explain it.'],
      items: [{ title: 'Q3_Report.pdf', text: 'Analyzed' }],
      bullets: ['Revenue increased', 'Key opportunities', 'Important findings', 'Action points'],
    },
    {
      id: 'languages', heading: 'Speak Your Language.', visual: 'chips',
      body: ['Akaya understands and works across 99+ languages.'],
      bullets: ['English', 'हिन्दी', 'Hinglish · Kaise ho', 'বাংলা Bengali', 'मराठी Marathi', 'ગુજરાતી Gujarati', 'ಕನ್ನಡ Kannada', 'മലയാളം Malayalam', 'ਪੰਜਾਬੀ Punjabi', 'অসমীয়া Assamese', '+ 89 more'],
    },
    {
      id: 'skills', eyebrow: 'Skills', heading: 'One Assistant. Many Skills.', visual: 'skills',
      body: ['Everything Akaya can help you with, in one place.'],
      items: [
        { title: 'Web Search', text: 'Find current information from the web.', bubble: 'blue' },
        { title: 'Writing', text: 'Draft, rewrite and polish any text.', bubble: 'violet' },
        { title: 'Coding', text: 'Explain, write and debug code.', bubble: 'black' },
        { title: 'Translation', text: 'Translate across 99+ languages.', bubble: 'cyan' },
        { title: 'Image Generation', text: 'Create visuals from a description.', bubble: 'orange' },
        { title: 'Vision', text: 'Understand images and screenshots.', bubble: 'green' },
        { title: 'PDF AI', text: 'Read, summarize and explain documents.', bubble: 'cream' },
        { title: 'Calculator', text: 'Quick math and everyday conversions.', bubble: 'blue' },
        { title: 'Summarizer', text: 'Turn long content into key points.', bubble: 'violet' },
        { title: 'Tasks', text: 'Capture and organize what matters.', bubble: 'cyan' },
        { title: 'Reminders', text: 'Never miss the small things.', bubble: 'orange' },
        { title: 'Calendar', text: 'Plan your day by voice or chat.', bubble: 'green' },
        { title: 'Voice Notes', text: 'Speak now, read a clean note later.', bubble: 'pearl' },
        { title: 'Memory', text: 'Save preferences for better answers.', bubble: 'cream' },
        { title: 'Automation', text: 'Chain everyday steps together.', bubble: 'black' },
        { title: 'Smart Reply', text: 'Suggested replies in your tone.', bubble: 'violet' },
      ],
    },
    {
      id: 'memory', eyebrow: 'Memory', heading: 'An AI That Gets to Know You.', visual: 'card-list',
      body: ['Save useful preferences and information so Akaya can provide more personalized assistance.', 'You stay in control of your memories.'],
      bullets: ['Preferred language: Hinglish', 'Writing style: Professional', 'Favorite response format: Short', 'Saved preference: Morning reminders'],
    },
    {
      id: 'apps', heading: 'Works With the Apps You Use.', visual: 'apps',
      body: ['Connect supported apps and let Akaya help you work across your digital life.'],
      items: [{ title: 'WhatsApp' }, { title: 'Gmail' }, { title: 'Messages' }, { title: 'YouTube' }, { title: 'Telegram' }, { title: 'Discord' }],
      bullets: ['Ask First', 'Permission Based', 'User Controlled'],
    },
    {
      id: 'control', eyebrow: 'Privacy', heading: 'Powerful AI. Your Control.', visual: 'cards',
      items: [
        { title: 'Privacy', text: 'Choose online or offline AI for what you share.', bubble: 'green' },
        { title: 'Control', text: 'Manage memories, permissions and connected apps.', bubble: 'blue' },
        { title: 'Choice', text: 'Decide which models and features you use.', bubble: 'violet' },
      ],
      bullets: ['Choose Online or Offline AI', 'Control connected apps', 'Manage memories', 'Manage permissions', 'Control your data', 'Sign out from all devices'],
    },
    {
      id: 'real-life', heading: 'Built For Real Life.', visual: 'gradient-grid',
      body: ['One assistant for the moments that fill your day.'],
      items: [
        { title: 'Work', text: 'Write emails, summarize documents and organize tasks.', bubble: 'blue' },
        { title: 'Communication', text: 'Speak, translate and create better replies.', bubble: 'violet' },
        { title: 'Study', text: 'Ask questions, summarize PDFs and understand difficult topics.', bubble: 'cyan' },
        { title: 'Travel', text: 'Plan trips, translate languages and organize itineraries.', bubble: 'orange' },
        { title: 'Everyday Life', text: 'Reminders, calendar, voice notes and quick assistance.', bubble: 'green' },
      ],
    },
  ],
  ctas: [
    { label: 'Sign up free', href: '/signup', primary: true },
    { label: 'Log in', href: '/login' },
  ],
};

export const homeClosing = {
  heading: 'Ready to Meet Your AI Companion?',
  text: 'Chat. Voice. Create. Translate. Read. Automate. Online or offline — Akaya is always ready to help.',
  entity:
    'Akaya AI is a personal AI assistant app for Android, iOS and Windows. It combines an AI chatbot, voice AI assistant, floating AI assistant, PDF AI document reader, AI translation across 99+ languages, web search and everyday automation — using online AI models or supported offline on-device AI. Akaya is a software product, not a location or coworking space.',
};

/** Questions shown on the home FAQ teaser (answers from /faq). */
export const homeFaqIds = ['What is Akaya?', 'How do I start using Akaya?', 'What works offline?', 'What does online mode add?', 'Does Akaya switch modes automatically?', 'What is the Phone Agent?'];

export default home;
