import type { StoreFlow } from './base.js';

/** TODO(playwright:blinkit): verify URLs and fill selectors against the logged-in site; they change often. */
export const blinkitFlow: StoreFlow = {
  store: 'blinkit',
  stateKey: 'BLINKIT_STORAGE_STATE',
  selectors: {
    productCard: 'TODO',
    productName: 'TODO',
    productPrice: 'TODO',
    productSize: 'TODO',
    addButton: 'TODO',
    cartTotal: 'TODO',
  },
};
