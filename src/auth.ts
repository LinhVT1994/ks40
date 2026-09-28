import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { createHash } from 'node:crypto';
import { authConfig } from './auth.config';
import { db } from './lib/db';
import { verifyPassword } from './lib/auth-utils';
import { allowAuthAttempt } from './lib/rate-limit';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string') return null;
        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;
        if (!email || email.length > 254 || !password || Buffer.byteLength(password) > 72) return null;
        if (!await allowAuthAttempt('login', email)) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.password || user.status !== 'ACTIVE') return null;
        if (!await verifyPassword(password, user.password)) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image,
          role: user.role, status: user.status, remember: credentials.remember === 'true' };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        if (!user.email || profile?.email_verified !== true) return false;
        try {
          const existing = await db.user.findUnique({ where: { email: user.email } });
          if (existing?.status === 'LOCKED') return false;
          await db.user.upsert({
            where: { email: user.email },
            // Only backfill from Google — never overwrite a name/avatar the user set on Lenote.
            update: {
              ...(!existing?.name && { name: user.name ?? '' }),
              ...(!existing?.image && { image: user.image }),
            },
            create: { email: user.email, name: user.name ?? '', image: user.image },
          });
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      const now = Math.floor(Date.now() / 1000);
      if (user) {
        token.remember = (user as { remember?: boolean }).remember !== false;
        token.sessionStartedAt = now;
      }
      if (token.remember === false && now - Number(token.sessionStartedAt ?? token.iat ?? 0) > 86400) return null;
      // Recheck on EVERY server auth call: locks, deletions and role changes apply immediately.
      // Never accept role/onboarding/status from session.update() input.
      try {
        const email = user?.email ?? token.email;
        if (!email) return null;
        const dbUser = await db.user.findUnique({
          where: { email },
          select: { id: true, name: true, role: true, status: true, password: true,
            canWrite: true, username: true, image: true,
            onboarding: { select: { completedAt: true, skippedAt: true } } },
        });
        if (!dbUser || dbUser.status !== 'ACTIVE') return null;
        const version = createHash('sha256').update(dbUser.password ?? 'oauth').digest('hex');
        // Old JWTs and sessions predating a password reset must sign in again.
        if (!user && token.credentialVersion !== version) return null;
        token.credentialVersion = version;
        token.id = dbUser.id;
        token.name = dbUser.name;
        token.role = dbUser.role;
        token.status = dbUser.status;
        token.canWrite = dbUser.canWrite;
        token.username = dbUser.username;
        token.picture = dbUser.image;
        token.onboardingDone = !!(dbUser.onboarding?.completedAt ?? dbUser.onboarding?.skippedAt);
        return token;
      } catch {
        return null;
      }
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.name = token.name;
      session.user.role = token.role as typeof session.user.role;
      session.user.status = token.status as typeof session.user.status;
      (session.user as { username?: string | null }).username = token.username as string | null;
      session.user.image = token.picture;
      session.user.onboardingDone = token.onboardingDone as boolean;
      session.user.canWrite = token.canWrite === true;
      return session;
    },
  },
});
