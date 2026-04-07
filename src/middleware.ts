import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Bỏ qua static files và _next internals
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
