import type { Cta, FooterColumn, NavLink } from './types';

export const nav: NavLink[] = [
  { label: 'Product', href: '/overview' },
  { label: 'Agents', href: '/agents/phone' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Support', href: '/support' },
];

export const authCtas: Cta[] = [
  { label: 'Log in', href: '/login' },
  { label: 'Sign up', href: '/signup', primary: true },
];

export const footer: FooterColumn[] = [
  { title: 'Product', links: [{ label: 'Overview', href: '/overview' }, { label: 'Assistant', href: '/app' }, { label: 'Get started', href: '/get-started' }, { label: 'Pricing', href: '/pricing' }] },
  { title: 'Agents', links: [{ label: 'Phone Agent', href: '/agents/phone' }, { label: 'Job Search Agent', href: '/agents/job-search' }, { label: 'Shopping Agent', href: '/agents/shopping' }, { label: 'Grocery Agent', href: '/agents/grocery' }, { label: 'Finance Agent', href: '/agents/finance' }] },
  { title: 'Regions', links: [{ label: 'Akaya in India', href: '/ai-assistant-india' }, { label: 'Akaya in Canada', href: '/ai-assistant-canada' }] },
  { title: 'Resources', links: [{ label: 'Blog', href: '/blog' }, { label: 'FAQ', href: '/faq' }, { label: 'Support', href: '/support' }, { label: 'RSS', href: '/rss.xml' }] },
  { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Log in', href: '/login' }, { label: 'Sign up', href: '/signup' }] },
  { title: 'Legal', links: [{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Refund Policy', href: '/refund-policy' }] },
];
