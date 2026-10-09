export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
export const compact = (n: number) =>
  n >= 100000 ? `${(n / 100000).toFixed(1).replace(/\.0$/, '')}L` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n);
export const days = (d: number) => (d <= 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d} days`);
export function ago(t: number, now: number) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
export const BADGES = {
  best_price: { label: 'Best price', cls: 'b-price', icon: 'rupee' },
  best_rated: { label: 'Best rated', cls: 'b-rated', icon: 'star' },
  best_value: { label: 'Best value', cls: 'b-value', icon: 'spark' },
  fastest: { label: 'Fastest', cls: 'b-fast', icon: 'truck' },
} as const;
export const STORE_COLORS: Record<string, { color: string; mono: string }> = {
  amazon: { color: '#ff9900', mono: 'a' },
  flipkart: { color: '#2874f0', mono: 'F' },
  myntra: { color: '#ff3f6c', mono: 'M' },
  meesho: { color: '#9f2089', mono: 'Me' },
  croma: { color: '#12b28c', mono: 'C' },
  ajio: { color: '#2c4152', mono: 'AJ' },
  reliance: { color: '#e42529', mono: 'RD' },
  tatacliq: { color: '#3a3a3a', mono: 'TC' },
  nykaa: { color: '#fc2779', mono: 'N' },
  other: { color: '#64748b', mono: '•' },
};
export const STORE_NAMES: Record<string, string> = {
  amazon: 'Amazon',
  flipkart: 'Flipkart',
  myntra: 'Myntra',
  meesho: 'Meesho',
  croma: 'Croma',
  ajio: 'AJIO',
  reliance: 'Reliance Digital',
  tatacliq: 'Tata CLiQ',
  nykaa: 'Nykaa',
};
