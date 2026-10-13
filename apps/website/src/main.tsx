/**
 * Client entry. Pages are static HTML (prerendered); only interactive "islands" get JavaScript,
 * which keeps the bundle small for Core Web Vitals.
 */
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import '@akaya/ui/fonts';
import '@akaya/ui/tokens.css';
import './styles/site.css';
import { ConsentBanner } from './components/layout/ConsentBanner';
import { toggleTheme } from './components/layout/theme';
import { AuthForm, type AuthMode } from './components/sections/AuthForm';

document.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-theme-toggle]')) toggleTheme();
});

const consent = document.getElementById('consent-root');
if (consent) createRoot(consent).render(<ConsentBanner />);

document.querySelectorAll<HTMLElement>('[data-island="auth"]').forEach((el) => {
  hydrateRoot(el, <StrictMode><AuthForm mode={el.dataset.mode as AuthMode} /></StrictMode>);
});

// Blog search (WebSite SearchAction target /blog?q=…): filters the prerendered cards client-side.
const q = new URLSearchParams(location.search).get('q')?.toLowerCase().trim();
if (q && location.pathname.startsWith('/blog')) {
  const input = document.querySelector<HTMLInputElement>('.blog-search input');
  if (input) input.value = q;
  document.querySelectorAll<HTMLElement>('.post-card').forEach((c) => { c.hidden = !c.innerText.toLowerCase().includes(q); });
}
