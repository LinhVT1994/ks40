import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: 'ADMIN' | 'PREMIUM' | 'MEMBER';
    status?: 'ACTIVE' | 'LOCKED';
    username?: string | null;
    onboardingDone?: boolean;
    canWrite?: boolean;
  }
}
