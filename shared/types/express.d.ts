import type { AuthUser } from './user';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      authUser?: AuthUser;
      currentUser?: AuthUser;
    }
  }
}

export {};