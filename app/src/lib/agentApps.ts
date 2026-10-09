/**
 * Standalone agent apps (see ../agents in the monorepo). Each runs its own backend + UI; Akaya opens it.
 * Set the URLs at build time; defaults are the agents' local dev servers.
 */
export interface AgentApp {
  id: 'shopping' | 'grocery';
  name: string;
  desc: string;
  emoji: string;
  grad: string;
  url: string;
}
export const AGENT_APPS: AgentApp[] = [
  {
    id: 'shopping',
    name: 'Shopping Agent',
    desc: 'Best deal across Amazon, Flipkart & more. Price alerts. You buy in the store.',
    emoji: '🛍️',
    grad: 'var(--g-brand)',
    url: import.meta.env.VITE_SHOPPING_AGENT_URL ?? 'http://localhost:5174',
  },
  {
    id: 'grocery',
    name: 'Grocery Agent',
    desc: 'Your list → cheapest or fastest basket on Instamart, Blinkit, Zepto & more. You pay.',
    emoji: '🧺',
    grad: 'var(--g-green)',
    url: import.meta.env.VITE_GROCERY_AGENT_URL ?? 'http://localhost:5175',
  },
];
