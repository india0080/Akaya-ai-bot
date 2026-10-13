/** Flips light/dark on <html data-theme> and remembers the choice. */
export function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('akaya-theme', next);
}
