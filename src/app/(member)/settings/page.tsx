import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getPreferencesAction } from '@/features/onboarding/actions/onboarding';
import SettingsLayoutClient from '@/features/member/components/SettingsLayoutClient';
import { Occupation } from '@prisma/client';
import { getEnabledTopicsAction } from '@/features/admin/actions/topic';
import { db } from '@/lib/db';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:  'Cài đặt',
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [prefs, dbUser, topics, followedTopics] = await Promise.all([
    getPreferencesAction(),
    db.user.findUnique({ where: { id: session.user.id }, select: { bio: true, username: true, websiteUrl: true, facebookUrl: true, instagramUrl: true, twitterUrl: true, linkedinUrl: true, githubUrl: true, youtubeUrl: true } }),
    getEnabledTopicsAction(),
    (db as any).topicFollow.findMany({
      where: { userId: session.user.id },
      select: { topicId: true }
    }),
  ]);

  const followedTopicIds = (followedTopics as { topicId: string }[]).map(f => f.topicId);
  const user = {
    ...session.user,
    bio: dbUser?.bio ?? null,
    username: dbUser?.username ?? null,
    websiteUrl: dbUser?.websiteUrl ?? null,
    facebookUrl: dbUser?.facebookUrl ?? null,
    instagramUrl: dbUser?.instagramUrl ?? null,
    twitterUrl: dbUser?.twitterUrl ?? null,
    linkedinUrl: dbUser?.linkedinUrl ?? null,
    githubUrl: dbUser?.githubUrl ?? null,
    youtubeUrl: dbUser?.youtubeUrl ?? null,
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-10 w-full animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-zinc-800 dark:text-white tracking-tight">Cài đặt</h1>
        <p className="text-zinc-500 mt-2 text-sm leading-relaxed">Quản lý trang hồ sơ cá nhân, các tùy chỉnh thuật toán<br />và thiết lập bảo mật truy cập hệ thống dành cho bạn.</p>
      </div>

      <SettingsLayoutClient
        user={user}
        initialOccupation={(prefs?.occupation ?? null) as Occupation | null}
        initialTopics={followedTopicIds}
        availableTopics={topics}
        initialCodeTheme={(prefs as any)?.codeTheme ?? 'dracula'}
      />
    </div>
  );
}
