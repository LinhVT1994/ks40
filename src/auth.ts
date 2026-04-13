import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import { db } from './lib/db';
import { verifyPassword } from './lib/auth-utils';
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 ngày
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const { email, password, remember } = credentials as { email: string; password: string; remember?: string };
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;
        if (user.status === 'LOCKED') return null;

        const valid = await verifyPassword(password, user.password);
        if (!valid) return null;

        return {
          id:     user.id,
          name:   user.name,
          email:  user.email,
          image:  user.image,
          role:   user.role,
          status: user.status,
          remember: remember === 'true',
        };
      },
    }),
  ],
  callbacks: {
    // Tạo/cập nhật user Google trong DB khi đăng nhập
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await db.user.upsert({
            where:  { email: user.email! },
            update: { name: user.name ?? '', image: user.image },
            create: { email: user.email!, name: user.name ?? '', image: user.image },
          });
        } catch {
          return false;
        }
      }
      return true;
    },

    // Ghi role/status vào JWT token
    async jwt({ token, user, account, trigger, session }) {
      // 1. Kiểm tra logic "Ghi nhớ" (Remember Me)
      // Nếu không chọn ghi nhớ, giới hạn phiên trong 24 giờ
      if (user) {
        token.remember = (user as any).remember;
      }
      
      if (token.remember === false && token.iat) {
        const now = Math.floor(Date.now() / 1000);
        const age = now - (token.iat as number);
        if (age > 24 * 60 * 60) return null; // Hết hạn phiên logical
      }

      // Fast-path: update() truyền onboardingDone trực tiếp, không cần query DB
      if (trigger === 'update' && (session as { onboardingDone?: boolean })?.onboardingDone !== undefined) {
        token.onboardingDone = (session as { onboardingDone?: boolean }).onboardingDone;
        return token;
      }
      // Refresh từ DB khi: đăng nhập, update session, token cũ thiếu canWrite, hoặc mỗi 5 phút
      const now = Math.floor(Date.now() / 1000);
      const lastRefresh = (token.lastRefresh as number) ?? 0;
      const shouldRefresh = user || trigger === 'update' || token.canWrite === undefined || (now - lastRefresh > 300);
      if (shouldRefresh) {
        token.lastRefresh = now;
        try {
          const email = user?.email ?? (token.email as string | undefined);
          if (!email) return token;
          const dbUser = await db.user.findUnique({
            where:   { email },
            select:  { id: true, role: true, status: true, canWrite: true, username: true, onboarding: { select: { completedAt: true, skippedAt: true } } },
          });
          if (dbUser) {
            token.id       = dbUser.id;
            token.role     = dbUser.role;
            token.status   = dbUser.status;
            token.canWrite = dbUser.canWrite;
            token.username = dbUser.username;
          } else {
            token.id       = user?.id ?? token.id ?? '';
            token.role     = token.role ?? 'MEMBER';
            token.status   = token.status ?? 'ACTIVE';
            token.canWrite = token.canWrite ?? false;
          }
          token.onboardingDone = !!(dbUser?.onboarding?.completedAt ?? dbUser?.onboarding?.skippedAt);
        } catch {
          if (user) {
            token.id     = user.id ?? '';
            token.role   = (user as { role?: string }).role ?? 'MEMBER';
            token.status = (user as { status?: string }).status ?? 'ACTIVE';
          }
          token.canWrite = token.canWrite ?? false;
        }
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { role?: string }).role               = token.role as string;
      (session.user as { status?: string }).status           = token.status as string;
      (session.user as { username?: string | null }).username = token.username as string | null;
      (session.user as { onboardingDone?: boolean }).onboardingDone = token.onboardingDone as boolean;
      (session.user as { canWrite?: boolean }).canWrite      = (token.canWrite as boolean) ?? false;
      return session;
    },

    // authorized từ authConfig (middleware)
    ...authConfig.callbacks,
  },
});
