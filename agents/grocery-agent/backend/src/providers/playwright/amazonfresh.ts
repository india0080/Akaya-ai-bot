import type { StoreFlow } from './base.js';

/** TODO(playwright:amazonfresh): verify URLs and fill selectors against the logged-in site; they change often. */
export const amazonfreshFlow: StoreFlow = {
  store: 'amazon-fresh',
  stateKey: 'AMAZON_FRESH_STORAGE_STATE',
  selectors: {
    productCard: 'TODO',
    productName: 'TODO',
    productPrice: 'TODO',
    productSize: 'TODO',
    addButton: 'TODO',
    cartTotal: 'TODO',
  },
};
