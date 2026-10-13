import type { PageContent } from './types';

const authPage = (key: string, path: string, title: string, heading: string, text: string): PageContent => ({
  key, kind: 'auth', path, bubble: 'pearl',
  seo: { title, description: text, keywords: [], path, noindex: true },
  hero: { id: key, heading, body: [text] },
  sections: [],
});

export const authPages: PageContent[] = [
  authPage('login', '/login', 'Log in to Akaya', 'Welcome back.', 'Log in to your Akaya account to continue with your AI assistant.'),
  authPage('signup', '/signup', 'Create your Akaya account', 'Create your Akaya account.', 'Start free with 100 credits a month. No card needed.'),
  authPage('forgot-password', '/forgot-password', 'Reset your Akaya password', 'Forgot your password?', 'Enter your email and we will send you a link to reset it.'),
];
