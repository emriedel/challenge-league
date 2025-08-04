import 'next-auth';
import type { AuthUser } from './user';

declare module 'next-auth' {
  interface Session {
    user: AuthUser;
  }

  interface User extends AuthUser {}
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    username?: string;
    profilePhoto?: string;
  }
}