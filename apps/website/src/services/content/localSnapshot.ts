import home from '../../content/home';
import { authPages } from '../../content/auth';
import { importedPages } from '../../content/pages';
import { plans } from '../../content/pricing';
import { authCtas, footer, nav } from '../../content/site';
import { posts } from '../../content/blog';
import type { ContentSnapshot } from './types';

/** Local JSON/TS content. Replace with an API snapshot (see docs/ADMIN-INTEGRATION.md). */
export const localSnapshot: ContentSnapshot = { pages: [home, ...importedPages, ...authPages], plans, nav, authCtas, footer, posts };
