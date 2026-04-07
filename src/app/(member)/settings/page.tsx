import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getPreferencesAction } from '@/features/onboarding/actions/onboarding';
import SettingsLayoutClient from '@/features/member/components/SettingsLayoutClient';
import { ArticleCategory, Occupation } from '@prisma/client';
import { db } from '@/lib/db';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [prefs, dbUser] = await Promise.all([
    getPreferencesAction(),
    db.user.findUnique({ where: { id: session.user.id }, select: { bio: true } }),
  ]);

  const user = { ...session.user, bio: dbUser?.bio ?? null };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-12 py-10 w-full animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Cài đặt</h1>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed">Quản lý trang hồ sơ cá nhân, các tùy chỉnh thuật toán<br />và thiết lập bảo mật truy cập hệ thống dành cho bạn.</p>
      </div>

      <SettingsLayoutClient
        user={user}
        initialOccupation={(prefs?.occupation ?? null) as Occupation | null}
        initialCategories={(prefs?.interestedCategories ?? []) as ArticleCategory[]}
        initialCodeTheme={(prefs as any)?.codeTheme ?? 'dracula'}
      />
    </div>
  );
}
