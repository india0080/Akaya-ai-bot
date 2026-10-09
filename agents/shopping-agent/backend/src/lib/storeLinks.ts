/** Store search deep links (public search pages). Agents open these; they never check out. */
import type { StoreId } from '../types.js';

const enc = encodeURIComponent;
export function storeSearchUrl(store: StoreId, q: string): string {
  switch (store) {
    case 'amazon':
      return `https://www.amazon.in/s?k=${enc(q)}`;
    case 'flipkart':
      return `https://www.flipkart.com/search?q=${enc(q)}`;
    case 'myntra':
      return `https://www.myntra.com/${enc(q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))}`;
    case 'meesho':
      return `https://www.meesho.com/search?q=${enc(q)}`;
    case 'croma':
      return `https://www.croma.com/searchB?q=${enc(q)}`;
    case 'ajio':
      return `https://www.ajio.com/search/?text=${enc(q)}`;
    case 'reliance':
      return `https://www.reliancedigital.in/search?q=${enc(q)}`;
    case 'tatacliq':
      return `https://www.tatacliq.com/search/?searchCategory=all&text=${enc(q)}`;
    case 'nykaa':
      return `https://www.nykaa.com/search/result/?q=${enc(q)}`;
    default:
      return `https://www.google.com/search?tbm=shop&q=${enc(q)}`;
  }
}
