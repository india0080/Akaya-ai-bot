/**
 * Catalog of 100 apps relevant to Indian office users.
 * Icons are neutral monogram tiles in each brand's colour. No trademarked logo files are bundled.
 * Swap in official logos only per each brand's guidelines.
 */
import type { Ability, CategoryId, ConnectKind, IntegrationApp } from './types';

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'messaging', label: 'Messaging' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'docs', label: 'Notes & Docs' },
  { id: 'storage', label: 'Storage' },
  { id: 'tasks', label: 'Productivity' },
  { id: 'crm', label: 'CRM & Sales' },
  { id: 'finance', label: 'Finance' },
  { id: 'social', label: 'Social' },
  { id: 'india', label: 'Shopping & Travel' },
  { id: 'dev', label: 'Dev & Design' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'forms', label: 'Forms & Sheets' },
  { id: 'support', label: 'Support' },
  { id: 'hr', label: 'HR' },
  { id: 'automation', label: 'Automation' },
];

const a = (key: string, label: string, prompt: string): Ability => ({ key, label, prompt });

/** Default abilities + permissions per category; individual apps can override. */
const DEFAULTS: Record<CategoryId, { abilities: (n: string) => Ability[]; permissions: (n: string) => string[] }> = {
  email: {
    abilities: (n) => [
      a('summarize', 'Read & summarise your inbox', `Summarise my unread ${n} emails`),
      a('draft', 'Draft replies in your tone', `Draft a polite reply to the latest ${n} email`),
      a('floating', `Floating reply inside ${n}`, `Help me reply in ${n}`),
    ],
    permissions: (n) => [
      `Read your ${n} messages and labels`,
      'Create drafts (you review before sending)',
      'Send only when you tap Send',
    ],
  },
  messaging: {
    abilities: (n) => [
      a('summarize', 'Catch up on long threads', `Summarise my unread ${n} messages`),
      a('draft', 'Draft and translate replies', `Draft a reply in ${n} in Hindi`),
      a('remind', 'Turn messages into reminders', `Remind me about my last ${n} message`),
    ],
    permissions: (n) => [
      `Read messages in chats you choose in ${n}`,
      'Post messages only when you confirm',
      'View your profile name',
    ],
  },
  calendar: {
    abilities: (n) => [
      a('agenda', 'Daily agenda in your morning brief', `What's on my ${n} today?`),
      a('schedule', 'Create events by voice', `Add a meeting with Rahul tomorrow at 3 PM to ${n}`),
      a('conflicts', 'Spot clashes and suggest free slots', `Find a free 30-minute slot this week in ${n}`),
    ],
    permissions: (n) => [`See events on your ${n}`, 'Create and edit events you ask for', 'See free/busy times'],
  },
  docs: {
    abilities: (n) => [
      a('search', `Search and summarise ${n} pages`, `Summarise my latest ${n} page`),
      a('save', `Save Smart Notes to ${n}`, `Save my last note to ${n}`),
      a('write', 'Draft docs and meeting notes', `Draft meeting notes in ${n}`),
    ],
    permissions: (n) => [`Read pages you share with Akaya in ${n}`, 'Create new pages', 'Edit pages Akaya created'],
  },
  storage: {
    abilities: (n) => [
      a('find', 'Find files by asking', `Find the latest invoice PDF in ${n}`),
      a('summarize', 'Summarise PDFs and docs', `Summarise the newest file in ${n}`),
      a('share', 'Share links in chats', `Share the Q3 report link from ${n}`),
    ],
    permissions: (n) => [
      `See files in ${n} you open with Akaya`,
      'Download files to summarise them',
      'Create share links when you ask',
    ],
  },
  tasks: {
    abilities: (n) => [
      a('create', 'Create tasks by voice', `Add "Send invoice to Rahul" to ${n}`),
      a('digest', 'Daily digest of due tasks', `What's due today in ${n}?`),
      a('update', 'Update status and comments', `Mark my top ${n} task as done`),
    ],
    permissions: (n) => [`See your ${n} projects and tasks`, 'Create and update tasks', 'Add comments'],
  },
  crm: {
    abilities: (n) => [
      a('lookup', 'Look up contacts and deals', `Show my open deals in ${n}`),
      a('log', 'Log calls and notes after meetings', `Log a call with Neha in ${n}`),
      a('followup', 'Create follow-up reminders', `Which ${n} leads need a follow-up today?`),
    ],
    permissions: (n) => [
      `Read contacts, deals and activities in ${n}`,
      'Create notes, tasks and activities',
      'No deletion of records',
    ],
  },
  finance: {
    abilities: (n) => [
      a('summary', 'Daily payments & dues summary', `Summarise today's ${n} payments`),
      a('invoice', 'Draft invoices and payment links', `Create a ₹5,000 payment link in ${n}`),
      a('alerts', 'Alerts for failed or pending payments', `Any failed payments in ${n}?`),
    ],
    permissions: (n) => [
      `Read transactions and invoices in ${n}`,
      'Create drafts you approve',
      'No money movement without your confirmation',
    ],
  },
  social: {
    abilities: (n) => [
      a('draft', 'Draft and polish posts', `Draft a ${n} post about our product launch`),
      a('schedule', 'Schedule posts', `Schedule my post on ${n} for 10 AM tomorrow`),
      a('insights', 'Summarise comments and insights', `Summarise comments on my last ${n} post`),
    ],
    permissions: (n) => [`View your ${n} profile`, 'Publish posts only when you confirm', 'Read post insights'],
  },
  india: {
    abilities: (n) => [
      a('open', `Open ${n} with details filled in`, `Open ${n}`),
      a('suggest', 'Smart suggestions in chat', `Suggest something on ${n} for tonight`),
    ],
    permissions: () => ['No account access: Akaya only opens the app', 'You complete payment in the app itself'],
  },
  dev: {
    abilities: (n) => [
      a('summarize', 'Summarise activity and reviews', `Summarise my ${n} notifications`),
      a('create', 'Create issues or items by voice', `Create a ${n} item for the login bug`),
      a('share', 'Share links in chats', `Share my latest ${n} link with the team`),
    ],
    permissions: (n) => [`Read projects you choose in ${n}`, 'Create items and comments', 'No delete permissions'],
  },
  meetings: {
    abilities: (n) => [
      a('join', 'Join and schedule meetings', `Schedule a ${n} call with Rahul at 4 PM`),
      a('notes', 'Meeting summaries and action items', `Summarise my last ${n} meeting`),
    ],
    permissions: (n) => [
      `See your ${n} meetings`,
      'Create meetings you ask for',
      'Read recordings/transcripts you choose',
    ],
  },
  forms: {
    abilities: (n) => [
      a('query', 'Ask questions about your data', `What were last week's totals in ${n}?`),
      a('add', 'Add rows and responses by voice', `Add today's expense to ${n}`),
      a('summary', 'Summarise new responses', `Summarise new ${n} responses`),
    ],
    permissions: (n) => [`Read sheets or bases you choose in ${n}`, 'Add and edit rows', 'No sharing changes'],
  },
  support: {
    abilities: (n) => [
      a('triage', 'Summarise and prioritise tickets', `Show urgent ${n} tickets`),
      a('draft', 'Draft replies in any language', `Draft a reply to the oldest ${n} ticket`),
    ],
    permissions: (n) => [`Read tickets in ${n}`, 'Create draft replies and internal notes'],
  },
  hr: {
    abilities: (n) => [
      a('leave', 'Apply for leave by voice', `Apply for leave on Friday in ${n}`),
      a('attendance', 'Check attendance and payslips', `Show my attendance this month on ${n}`),
    ],
    permissions: (n) => [`View your ${n} employee profile`, 'Submit requests you confirm'],
  },
  automation: {
    abilities: (n) => [
      a('trigger', `Trigger ${n} workflows by voice`, `Run my "new lead" ${n} workflow`),
      a('status', 'Check workflow runs', `Did my ${n} workflows fail today?`),
    ],
    permissions: (n) => [`List your ${n} workflows`, 'Trigger workflows you choose'],
  },
};

type Row = [id: string, name: string, cat: CategoryId, desc: string, color: string, opts?: Partial<IntegrationApp>];

const DL: Partial<IntegrationApp> = { kind: 'deeplink' };
const dark = { darkText: true };

const ROWS: Row[] = [
  // Email
  [
    'gmail',
    'Gmail',
    'email',
    'Summarise your inbox, draft replies and reply from the Floating bubble.',
    '#EA4335',
    { popular: true, mono: 'Gm' },
  ],
  [
    'outlook',
    'Outlook',
    'email',
    'Triage work mail, draft replies and catch up on threads.',
    '#0078D4',
    { popular: true, mono: 'Ol' },
  ],
  ['yahoo-mail', 'Yahoo Mail', 'email', 'Read, summarise and reply to Yahoo Mail.', '#6001D2', { mono: 'Y!' }],
  ['zoho-mail', 'Zoho Mail', 'email', 'Business email summaries and reply drafts.', '#E42527', { mono: 'ZM' }],
  [
    'proton-mail',
    'Proton Mail',
    'email',
    'Summaries and drafts via Proton Mail Bridge.',
    '#6D4AFF',
    { mono: 'Pm', kind: 'connector' },
  ],
  // Messaging
  [
    'whatsapp-business',
    'WhatsApp Business',
    'messaging',
    'Official Business Platform and click-to-chat replies, with translation.',
    '#25D366',
    {
      popular: true,
      mono: 'WB',
      kind: 'business-api',
      abilities: [
        a('clicktochat', 'Click-to-chat replies (wa.me links)', 'Reply to Rahul on WhatsApp'),
        a('templates', 'Business templates & quick replies', 'Send the order-confirmed template'),
        a('translate', 'Translate customer messages', 'Translate the last customer message to English'),
      ],
      permissions: [
        'Uses the official WhatsApp Business Platform (Cloud API) or click-to-chat links',
        'No unofficial bots or personal-account automation',
        'Messages are sent only when you tap Send',
      ],
    },
  ],
  [
    'telegram',
    'Telegram',
    'messaging',
    'Bot-based summaries and replies in chats you choose.',
    '#26A5E4',
    { mono: 'Tg' },
  ],
  [
    'slack',
    'Slack',
    'messaging',
    'Catch up on channels, draft replies and set reminders.',
    '#4A154B',
    { popular: true, mono: 'Sl' },
  ],
  [
    'teams',
    'Microsoft Teams',
    'messaging',
    'Summarise chats and channels, draft replies.',
    '#6264A7',
    { popular: true, mono: 'Te' },
  ],
  ['discord', 'Discord', 'messaging', 'Summaries and replies for your servers.', '#5865F2', { mono: 'Dc' }],
  ['google-chat', 'Google Chat', 'messaging', 'Spaces summaries and quick replies.', '#00AC47', { mono: 'GC' }],
  // Calendar
  [
    'google-calendar',
    'Google Calendar',
    'calendar',
    'Agenda in your morning brief and voice scheduling.',
    '#4285F4',
    { popular: true, mono: '31' },
  ],
  [
    'outlook-calendar',
    'Outlook Calendar',
    'calendar',
    'Work meetings, free slots and voice scheduling.',
    '#0F6CBD',
    { mono: 'OC' },
  ],
  ['calendly', 'Calendly', 'calendar', 'Share booking links and see upcoming bookings.', '#006BFF', { mono: 'Ca' }],
  ['cal-com', 'Cal.com', 'calendar', 'Booking links and upcoming bookings.', '#111827', { mono: 'Cc' }],
  // Notes & Docs
  [
    'notion',
    'Notion',
    'docs',
    'Search pages, save Smart Notes and draft docs.',
    '#191919',
    {
      popular: true,
      mono: 'N',
      abilities: [
        a('search', 'Search & summarise pages', 'Summarise my "Q4 roadmap" Notion page'),
        a('save', 'Save Smart Notes to a Notion page', 'Save my last note to Notion'),
        a('tasks', 'Add to-dos to your task database', 'Add "Call Rahul" to my Notion tasks'),
      ],
      permissions: [
        'Read pages and databases you select',
        'Create pages and database entries',
        'Edit pages Akaya created',
      ],
    },
  ],
  ['google-docs', 'Google Docs', 'docs', 'Summarise docs and draft new ones.', '#4285F4', { mono: 'Do' }],
  ['evernote', 'Evernote', 'docs', 'Search notes and save Smart Notes.', '#00A82D', { mono: 'Ev' }],
  ['onenote', 'OneNote', 'docs', 'Search notebooks and save notes.', '#7719AA', { mono: 'On' }],
  [
    'obsidian',
    'Obsidian',
    'docs',
    'Read and write notes in your local vault.',
    '#7C3AED',
    { mono: 'Ob', kind: 'connector' },
  ],
  ['confluence', 'Confluence', 'docs', 'Search team spaces and summarise pages.', '#172B4D', { mono: 'Cf' }],
  ['google-keep', 'Google Keep', 'docs', 'Sync Smart Notes and checklists.', '#FBBC04', { mono: 'K', ...dark }],
  ['coda', 'Coda', 'docs', 'Query docs and tables by asking.', '#F46A54', { mono: 'Co' }],
  ['word', 'Microsoft Word', 'docs', 'Summarise and draft documents.', '#2B579A', { mono: 'W' }],
  // Storage
  [
    'google-drive',
    'Google Drive',
    'storage',
    'Find files, summarise PDFs and share links.',
    '#1FA463',
    { popular: true, mono: 'Dr' },
  ],
  ['dropbox', 'Dropbox', 'storage', 'Find, summarise and share files.', '#0061FF', { mono: 'Db' }],
  ['onedrive', 'OneDrive', 'storage', 'Work files, summaries and share links.', '#0078D4', { mono: 'OD' }],
  ['box', 'Box', 'storage', 'Enterprise files and summaries.', '#0061D5', { mono: 'Bx' }],
  [
    'digilocker',
    'DigiLocker',
    'storage',
    'Find your documents quickly (official partner API).',
    '#3F51B5',
    { mono: 'DL' },
  ],
  // Productivity / PM
  ['trello', 'Trello', 'tasks', 'Create cards by voice and get due-today digests.', '#0079BF', { mono: 'Tr' }],
  ['asana', 'Asana', 'tasks', 'Tasks by voice, digests and status updates.', '#F06A6A', { mono: 'As' }],
  ['jira', 'Jira', 'tasks', 'Create issues, summarise sprints and updates.', '#0052CC', { popular: true, mono: 'Ji' }],
  ['clickup', 'ClickUp', 'tasks', 'Tasks, docs and daily digests.', '#7B68EE', { mono: 'CU' }],
  ['monday', 'monday.com', 'tasks', 'Boards, updates and reminders.', '#FF3D57', { mono: 'mo' }],
  ['todoist', 'Todoist', 'tasks', 'Add tasks by voice and daily plans.', '#E44332', { mono: 'Td' }],
  ['linear', 'Linear', 'tasks', 'Issues by voice and cycle summaries.', '#5E6AD2', { mono: 'Li' }],
  ['microsoft-todo', 'Microsoft To Do', 'tasks', 'Sync reminders and to-dos.', '#2564CF', { mono: 'TD' }],
  ['google-tasks', 'Google Tasks', 'tasks', 'Sync reminders with Google Tasks.', '#1A73E8', { mono: 'GT' }],
  ['zoho-projects', 'Zoho Projects', 'tasks', 'Tasks, timesheets and updates.', '#E42527', { mono: 'ZP' }],
  // CRM
  ['hubspot', 'HubSpot', 'crm', 'Look up contacts, log calls and follow-ups.', '#FF7A59', { mono: 'Hs' }],
  ['salesforce', 'Salesforce', 'crm', 'Deals, contacts and activity logging.', '#00A1E0', { mono: 'Sf' }],
  ['zoho-crm', 'Zoho CRM', 'crm', 'Leads, deals and follow-up reminders.', '#E42527', { popular: true, mono: 'ZC' }],
  ['pipedrive', 'Pipedrive', 'crm', 'Pipeline updates and activity logging.', '#017737', { mono: 'Pd' }],
  ['freshsales', 'Freshsales', 'crm', 'Contacts, deals and sales follow-ups.', '#F36F21', { mono: 'Fs' }],
  ['leadsquared', 'LeadSquared', 'crm', 'Lead updates and call logging.', '#2C6ECB', { mono: 'LS' }],
  // Finance
  [
    'razorpay',
    'Razorpay',
    'finance',
    'Payment summaries, payment links and failed-payment alerts.',
    '#3395FF',
    { popular: true, mono: 'Rp' },
  ],
  [
    'paytm-business',
    'Paytm Business',
    'finance',
    'Daily collections and settlement summaries.',
    '#00BAF2',
    { mono: 'Pt' },
  ],
  [
    'phonepe-business',
    'PhonePe Business',
    'finance',
    'Collections and settlement summaries.',
    '#5F259F',
    { mono: 'Pe' },
  ],
  [
    'tally',
    'Tally',
    'finance',
    'Ledger and outstanding summaries via the Tally connector.',
    '#2E3192',
    { popular: true, mono: 'Ta', kind: 'connector' },
  ],
  ['zoho-books', 'Zoho Books', 'finance', 'Invoices, GST-ready drafts and dues.', '#E42527', { mono: 'ZB' }],
  ['quickbooks', 'QuickBooks', 'finance', 'Invoices, expenses and dues.', '#2CA01C', { mono: 'QB' }],
  ['stripe', 'Stripe', 'finance', 'Payments, payouts and payment links.', '#635BFF', { mono: 'St' }],
  ['cashfree', 'Cashfree', 'finance', 'Payment links and settlement summaries.', '#6933D3', { mono: 'Cf' }],
  ['khatabook', 'Khatabook', 'finance', 'Udhaar reminders and balances.', '#E53935', { mono: 'Kb' }],
  // Social
  [
    'linkedin',
    'LinkedIn',
    'social',
    'Draft posts, polish your profile and summarise comments.',
    '#0A66C2',
    { popular: true, mono: 'in' },
  ],
  ['x', 'X', 'social', 'Draft and schedule posts.', '#000000', { mono: 'X' }],
  [
    'instagram',
    'Instagram',
    'social',
    'Captions, scheduling and comment summaries (business accounts).',
    '#E1306C',
    { mono: 'Ig' },
  ],
  ['facebook', 'Facebook', 'social', 'Page posts and comment summaries.', '#1877F2', { mono: 'f' }],
  ['youtube', 'YouTube', 'social', 'Summarise videos and draft descriptions.', '#FF0000', { mono: 'YT' }],
  ['pinterest', 'Pinterest', 'social', 'Plan and draft pins.', '#E60023', { mono: 'P' }],
  ['reddit', 'Reddit', 'social', 'Summarise threads you follow.', '#FF4500', { mono: 'r/' }],
  // Shopping, food & travel (deep links)
  [
    'swiggy',
    'Swiggy',
    'india',
    'Opens Swiggy with your order idea, e.g. "biryani for 4".',
    '#FC8019',
    { ...DL, popular: true, mono: 'Sw' },
  ],
  ['zomato', 'Zomato', 'india', 'Opens Zomato with your dish or restaurant.', '#E23744', { ...DL, mono: 'Zo' }],
  [
    'uber',
    'Uber',
    'india',
    'Opens Uber with pickup and drop filled in.',
    '#000000',
    { ...DL, popular: true, mono: 'Ub' },
  ],
  ['ola', 'Ola', 'india', 'Opens Ola with your destination.', '#1C1C1C', { ...DL, mono: 'Ola' }],
  ['rapido', 'Rapido', 'india', 'Opens Rapido for a quick bike ride.', '#F9C935', { ...DL, mono: 'Ra', ...dark }],
  ['amazon', 'Amazon', 'india', 'Opens Amazon search for what you need.', '#FF9900', { ...DL, mono: 'a', ...dark }],
  ['flipkart', 'Flipkart', 'india', 'Opens Flipkart search with your item.', '#2874F0', { ...DL, mono: 'Fk' }],
  ['blinkit', 'Blinkit', 'india', 'Opens Blinkit with your grocery list.', '#F8CB46', { ...DL, mono: 'bl', ...dark }],
  ['zepto', 'Zepto', 'india', 'Opens Zepto with your grocery list.', '#3C006B', { ...DL, mono: 'Ze' }],
  ['bigbasket', 'BigBasket', 'india', 'Opens BigBasket with your weekly list.', '#84C225', { ...DL, mono: 'bb' }],
  [
    'makemytrip',
    'MakeMyTrip',
    'india',
    'Opens flight and hotel search for your trip.',
    '#E73C33',
    { ...DL, mono: 'my' },
  ],
  ['bookmyshow', 'BookMyShow', 'india', 'Opens movies and events near you.', '#F84464', { ...DL, mono: 'BMS' }],
  // Dev & design
  ['github', 'GitHub', 'dev', 'Summarise PRs and notifications, create issues.', '#181717', { mono: 'GH' }],
  ['gitlab', 'GitLab', 'dev', 'Merge requests and issue summaries.', '#FC6D26', { mono: 'GL' }],
  ['figma', 'Figma', 'dev', 'Summarise comments and share frames.', '#F24E1E', { mono: 'Fi' }],
  ['canva', 'Canva', 'dev', 'Find designs and draft captions.', '#00C4CC', { mono: 'Cv' }],
  ['miro', 'Miro', 'dev', 'Summarise boards and add sticky notes.', '#FFD02F', { mono: 'Mi', ...dark }],
  // Meetings
  ['zoom', 'Zoom', 'meetings', 'Schedule calls and get meeting summaries.', '#0B5CFF', { popular: true, mono: 'Zm' }],
  ['google-meet', 'Google Meet', 'meetings', 'Create Meet links and summaries.', '#00897B', { mono: 'Me' }],
  ['webex', 'Webex', 'meetings', 'Schedule and summarise Webex meetings.', '#00BCEB', { mono: 'Wx' }],
  ['loom', 'Loom', 'meetings', 'Summarise Looms and share links.', '#625DF5', { mono: 'Lo' }],
  // Forms & sheets
  [
    'google-sheets',
    'Google Sheets',
    'forms',
    'Ask questions about your sheets and add rows by voice.',
    '#0F9D58',
    { popular: true, mono: 'Sh' },
  ],
  ['excel', 'Microsoft Excel', 'forms', 'Query workbooks and add rows.', '#217346', { mono: 'X' }],
  ['airtable', 'Airtable', 'forms', 'Query bases and add records.', '#18BFFF', { mono: 'At' }],
  ['typeform', 'Typeform', 'forms', 'Summarise new responses.', '#262627', { mono: 'Ty' }],
  ['google-forms', 'Google Forms', 'forms', 'Summarise form responses.', '#673AB7', { mono: 'GF' }],
  ['jotform', 'Jotform', 'forms', 'Summarise submissions.', '#FF6100', { mono: 'Jf' }],
  ['surveymonkey', 'SurveyMonkey', 'forms', 'Survey results at a glance.', '#00BF6F', { mono: 'SM' }],
  // Support
  ['zendesk', 'Zendesk', 'support', 'Triage tickets and draft replies.', '#03363D', { mono: 'Zd' }],
  ['freshdesk', 'Freshdesk', 'support', 'Prioritise tickets and draft replies.', '#25C16F', { mono: 'Fd' }],
  ['intercom', 'Intercom', 'support', 'Summarise conversations and draft replies.', '#1F8DED', { mono: 'Ic' }],
  ['zoho-desk', 'Zoho Desk', 'support', 'Tickets and reply drafts.', '#E42527', { mono: 'ZD' }],
  // HR
  ['keka', 'Keka', 'hr', 'Apply leave and check attendance by voice.', '#6C5CE7', { mono: 'Ke' }],
  ['greythr', 'greytHR', 'hr', 'Leave, attendance and payslips.', '#0E6EB8', { mono: 'gH' }],
  ['darwinbox', 'Darwinbox', 'hr', 'Leave requests and HR updates.', '#2C3E91', { mono: 'Dx' }],
  ['zoho-people', 'Zoho People', 'hr', 'Leave and attendance.', '#E42527', { mono: 'ZPe' }],
  // Automation
  ['zapier', 'Zapier', 'automation', 'Trigger your Zaps by voice.', '#FF4F00', { mono: 'Za' }],
  ['make', 'Make', 'automation', 'Run scenarios by voice.', '#6D00CC', { mono: 'Mk' }],
  ['ifttt', 'IFTTT', 'automation', 'Trigger applets by voice.', '#222222', { mono: 'If' }],
];

export const APPS: IntegrationApp[] = ROWS.map(([id, name, category, desc, color, opts = {}]) => {
  const d = DEFAULTS[category];
  const kind: ConnectKind = opts.kind ?? 'oauth';
  return {
    id,
    name,
    category,
    desc,
    color,
    mono: opts.mono ?? name[0],
    kind,
    darkText: opts.darkText,
    popular: opts.popular,
    abilities: opts.abilities ?? d.abilities(name),
    permissions: opts.permissions ?? d.permissions(name),
  };
});

export const APP_BY_ID: Record<string, IntegrationApp> = Object.fromEntries(APPS.map((x) => [x.id, x]));
export const POPULAR = APPS.filter((x) => x.popular);

export const KIND_LABEL: Record<ConnectKind, string> = {
  oauth: 'Sign in',
  'business-api': 'Official API',
  deeplink: 'Deep link',
  connector: 'Connector',
};
