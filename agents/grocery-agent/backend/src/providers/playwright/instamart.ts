import type { StoreFlow } from './base.js';

/** TODO(playwright:instamart): verify URLs and fill selectors against the logged-in site; they change often. */
export const instamartFlow: StoreFlow = {
  store: 'instamart',
  stateKey: 'INSTAMART_STORAGE_STATE',
  selectors: {
    productCard: 'TODO',
    productName: 'TODO',
    productPrice: 'TODO',
    productSize: 'TODO',
    addButton: 'TODO',
    cartTotal: 'TODO',
  },
};
