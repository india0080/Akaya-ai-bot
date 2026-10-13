import type { Plan } from './types';

/** Plans shown on /pricing and the home teaser. Prices and allowances copied from akaya-voice-flow. */
export const plans: Plan[] = [
  {
    id: 'free', name: 'Free', monthly: '$0', yearly: '$0', credits: '100 credits / month',
    features: ['Basic AI Chat', 'Limited Memory', 'Basic Reminders', 'Basic Tasks', 'Limited PDF AI', 'Limited Floating Assistant', 'Basic AI model access', '5 AI images/month'],
    cta: { label: 'Start free', href: '/signup' },
  },
  {
    id: 'pro', name: 'Pro', monthly: '$14.99', yearly: '$149', suffix: '/month', credits: '3,000 credits / month', highlight: true,
    features: ['Everything in Free, plus:', 'Advanced AI Chat', 'Long-Term Memory', 'Smart Notes', 'AI PDF & File Understanding', 'AI Research', 'GPT, Claude, Gemini, DeepSeek, Grok & more', 'Full Floating Akaya with voice commands', 'All reminder types + Calendar, Tasks & Lists', 'Daily Briefing', 'Gmail, WhatsApp & email assistance', '50 AI images/month'],
    cta: { label: 'Choose Pro', href: '/signup?plan=pro', primary: true },
  },
  {
    id: 'pro-plus', name: 'Pro Plus', monthly: '$24.99', yearly: '$249', suffix: '/month', credits: '8,000 credits / month',
    features: ['Everything in Pro, plus:', 'Higher AI usage', 'Advanced AI models', 'Advanced AI Research', 'Larger PDF & document processing', 'Priority AI processing', 'Advanced Memory', 'Higher Floating Assistant usage', 'Advanced Follow-up', 'Advanced Email assistance', 'Premium AI model access', '150 AI images/month'],
    cta: { label: 'Choose Pro Plus', href: '/signup?plan=pro-plus' },
  },
  {
    id: 'founder', name: 'Founder 1000 Lifetime', monthly: '$149', suffix: ' once · 1 device', credits: '$199 for 2 devices · 1,000 AI images Founder Bonus',
    features: ['Lifetime Akaya software access', 'AI Chat & Long-Term Memory', 'Smart Notes, AI PDF & AI Research', 'Multiple AI model access', 'Floating Akaya & voice interaction', 'Offline AI on Android', 'Unlimited On-Device AI', 'Cloud AI Allowance Included', 'Early access to new features', 'Founder-only pricing'],
    cta: { label: 'Become a Founder', href: '/signup?plan=founder', primary: true },
  },
];

/** Section ids from the imported pricing page that the PlanGrid replaces. */
export const planSectionIds = ['free', 'pro', 'pro-plus', 'own-akaya-for-life'];
