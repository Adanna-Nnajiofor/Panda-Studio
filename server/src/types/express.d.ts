// import type { AuthUser } from '../../../shared/types/user';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: AuthUser;
//       authUser?: AuthUser;
//       currentUser?: AuthUser;
//     }
//   }
// }

// export {};

import type { AuthenticatedUser } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
    }
  }
}

export {};
