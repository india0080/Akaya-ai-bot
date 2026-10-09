import type { StoreFlow } from './base.js';

/** TODO(playwright:amazonfresh): verify URLs and fill selectors against the logged-in site; they change often. */
export const amazonfreshFlow: StoreFlow = {
  store: 'amazonfresh',
  stateKey: 'AMAZON_FRESH_STORAGE_STATE',
  home: 'https://www.amazon.in/alm/storefront?almBrandId=ctnow',
  searchUrl: (q) => `https://www.amazon.in/s?i=nowstore&k=${encodeURIComponent(q)}`,
  selectors: {
    productCard: 'TODO',
    productName: 'TODO',
    productPrice: 'TODO',
    productSize: 'TODO',
    addButton: 'TODO',
    cartTotal: 'TODO',
  },
};
