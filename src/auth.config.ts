import type { NextAuthConfig } from 'next-auth';

// Edge-compatible config (không import Prisma hay bcrypt)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  callbacks: {
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role                   = token.role as string;
        (session.user as { status?: string }).status               = token.status as string;
        (session.user as { onboardingDone?: boolean }).onboardingDone = token.onboardingDone as boolean;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const isAdminRoute      = path.startsWith('/admin');
      const isProfileRoute    = path.startsWith('/profile');
      const isOnboardingRoute = path.startsWith('/onboarding');
      const isAuthRoute       = ['/login', '/register', '/forgot-password'].includes(path);
      const isResetRoute      = path === '/reset-password';

      // Các route yêu cầu login (member area)
      const isProtectedRoute  = ['/settings', '/history', '/bookmarks', '/notifications'].some(p => path.startsWith(p));

      const role           = (auth?.user as { role?: string })?.role;
      const onboardingDone = (auth?.user as { onboardingDone?: boolean })?.onboardingDone;

      // Đã đăng nhập → redirect khỏi trang auth (trừ reset-password)
      if (isLoggedIn && isAuthRoute) {
        return Response.redirect(new URL(role === 'ADMIN' ? '/admin/overview' : '/', nextUrl));
      }

      // Reset password → ai cũng vào được
      if (isResetRoute) return true;

      // Chưa đăng nhập → không được vào các phân vùng bảo mật
      if (!isLoggedIn && (isAdminRoute || isProtectedRoute || isProfileRoute || isOnboardingRoute)) {
        return Response.redirect(new URL('/login', nextUrl));
      }

      // Đã đăng nhập + chưa onboarding → redirect /onboarding (trừ admin và profile)
      // Chú ý: Trang chủ (/) của Member cũng yêu cầu onboarding nếu đã login
      if (isLoggedIn && !onboardingDone && (path === '/' || isProtectedRoute || isProfileRoute) && role !== 'ADMIN') {
        return Response.redirect(new URL('/onboarding', nextUrl));
      }

      // Đã onboarding → không vào lại /onboarding
      if (isLoggedIn && onboardingDone && isOnboardingRoute) {
        return Response.redirect(new URL('/', nextUrl));
      }

      // Admin route → chỉ ADMIN
      if (isLoggedIn && isAdminRoute) {
        if (role !== 'ADMIN') {
          return Response.redirect(new URL('/', nextUrl));
        }
      }

      return true;
    },
  },
  providers: [], // providers được thêm trong auth.ts
};
