import { createContentService } from './createContentService';
import { localSnapshot } from './localSnapshot';

export type * from './types';
export const content = createContentService(localSnapshot);
