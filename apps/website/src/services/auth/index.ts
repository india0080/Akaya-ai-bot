import { stubAuthService } from './stubAuthService';
import type { AuthService } from './types';

export type * from './types';

/** Swap the implementation here (e.g. createApiAuthService(config.apiBaseUrl)) when the backend is ready. */
export const authService: AuthService = stubAuthService;
