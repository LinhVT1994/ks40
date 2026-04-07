import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Calendar, FileText, Eye, Heart } from 'lucide-react';
import { getPublicProfileAction } from '@/features/member/actions/profile';
import { getBookmarksAction } from '@/features/articles/actions/bookmark';
import { getReadHistoryAction } from '@/features/articles/actions/read-history';
import ProfileClient from './ProfileClient';

function formatViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicProfileAction(id);
  if (!data) return {};

  const { user } = data;
  const title       = `${user.name} | Lenote.dev`;
  const description = user.bio ?? `Xem hồ sơ và bài viết của ${user.name} trên Lenote.dev`;
  const image       = user.image ?? null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      ...(image && { images: [{ url: image, alt: user.name ?? '' }] }),
    },
    twitter: {
      card:  image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image && { images: [image] }),
    },
    alternates: { canonical: `/profile/${id}` },
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;
  const isOwner = currentUserId === id;

  const [data, bookmarks, history] = await Promise.all([
    getPublicProfileAction(id),
    isOwner ? getBookmarksAction() : Promise.resolve(null),
    isOwner ? getReadHistoryAction() : Promise.resolve(null),
  ]);

  if (!data) notFound();
  const { user, articles, totalViews, totalLikes } = data;

  const avatarUrl = user.image
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name ?? 'User')}&background=e2e8f0&color=0f172a`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl p-8">
        <div className="flex items-start gap-5">
          <img
            src={avatarUrl}
            alt={user.name ?? ''}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/20 shadow-sm shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">{user.name}</h1>
              {isOwner && (
                <a href="/settings"
                  className="text-xs font-semibold text-slate-400 hover:text-primary transition-colors border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-lg">
                  Chỉnh sửa
                </a>
              )}
            </div>
            {user.bio && (
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{user.bio}</p>
            )}
            <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Tham gia từ {new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
          {[
            { icon: FileText, label: 'Bài viết',    value: user._count.articles },
            { icon: Eye,      label: 'Lượt xem',    value: formatViews(totalViews) },
            { icon: Heart,    label: 'Lượt thích',  value: formatViews(totalLikes) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-display">{value}</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-slate-500">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs: bài viết + (nếu là chủ) bookmark & history */}
      <ProfileClient
        articles={articles as any}
        bookmarks={bookmarks as any}
        history={history as any}
        isOwner={isOwner}
      />
    </div>
  );
}
