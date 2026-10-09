import type { StoreFlow } from './base.js';

/** TODO(playwright:blinkit): verify URLs and fill selectors against the logged-in site; they change often. */
export const blinkitFlow: StoreFlow = {
  store: 'blinkit',
  stateKey: 'BLINKIT_STORAGE_STATE',
  home: 'https://blinkit.com',
  searchUrl: (q) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
  selectors: {
    productCard: 'TODO',
    productName: 'TODO',
    productPrice: 'TODO',
    productSize: 'TODO',
    addButton: 'TODO',
    cartTotal: 'TODO',
  },
};
