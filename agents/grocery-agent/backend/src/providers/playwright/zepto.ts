import type { StoreFlow } from './base.js';

/** TODO(playwright:zepto): verify URLs and fill selectors against the logged-in site; they change often. */
export const zeptoFlow: StoreFlow = {
  store: 'zepto',
  stateKey: 'ZEPTO_STORAGE_STATE',
  home: 'https://www.zeptonow.com',
  searchUrl: (q) => `https://www.zeptonow.com/search?query=${encodeURIComponent(q)}`,
  selectors: {
    productCard: 'TODO',
    productName: 'TODO',
    productPrice: 'TODO',
    productSize: 'TODO',
    addButton: 'TODO',
    cartTotal: 'TODO',
  },
};
