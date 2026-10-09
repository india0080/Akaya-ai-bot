import type { StoreFlow } from './base.js';

/** TODO(playwright:bigbasket): verify URLs and fill selectors against the logged-in site; they change often. */
export const bigbasketFlow: StoreFlow = {
  store: 'bigbasket',
  stateKey: 'BIGBASKET_STORAGE_STATE',
  home: 'https://www.bigbasket.com',
  searchUrl: (q) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
  selectors: {
    productCard: 'TODO',
    productName: 'TODO',
    productPrice: 'TODO',
    productSize: 'TODO',
    addButton: 'TODO',
    cartTotal: 'TODO',
  },
};
