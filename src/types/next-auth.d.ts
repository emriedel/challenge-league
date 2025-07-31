import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      profilePhoto?: string;
    }
  }

  interface User {
    id: string;
    email: string;
    username: string;
    profilePhoto?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    username?: string;
    profilePhoto?: string;
  }
}