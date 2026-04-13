import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Calendar, FileText, Eye, Heart } from 'lucide-react';
import { getPublicProfileAction, getProfileArticlesAction } from '@/features/member/actions/profile';
import { getBookmarksAction } from '@/features/articles/actions/bookmark';
import { getReadHistoryAction } from '@/features/articles/actions/read-history';
import { getMemberDraftsAction } from '@/features/member/actions/write';
import { getFollowersAction } from '@/features/member/actions/profile-follow';
import { getAuthorInfoAction } from '@/features/member/actions/follow';
import { getDashboardStatsAction, getContinueReadingAction } from '@/features/member/actions/dashboard';
import { getArticleRatingsAction } from '@/features/articles/actions/rating';
import ProfileClient from './ProfileClient';
import PublicProfileClient from './PublicProfileClient';

function formatViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicProfileAction(id);
  if (!data) return {};

  const { user } = data;
  const title       = `${user.name} | Lenote`;
  const description = user.bio ?? `Xem hồ sơ và bài viết của ${user.name} trên Lenote`;
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
  const userRole = (session?.user as { role?: string })?.role;
  const canWrite = (session?.user as { canWrite?: boolean })?.canWrite || userRole === 'ADMIN';

  const [data, bookmarks, history, drafts, followersData, authorInfo, articlesData, dashboardStats, lastActivity, ratingsData] = await Promise.all([
    getPublicProfileAction(id),
    isOwner ? getBookmarksAction() : Promise.resolve(null),
    isOwner ? getReadHistoryAction() : Promise.resolve(null),
    isOwner && canWrite ? getMemberDraftsAction() : Promise.resolve(null),
    getFollowersAction(id),
    !isOwner ? getAuthorInfoAction(id) : Promise.resolve(null),
    getProfileArticlesAction(id),
    isOwner ? getDashboardStatsAction() : Promise.resolve(null),
    isOwner ? getContinueReadingAction() : Promise.resolve(null),
    isOwner && canWrite ? getArticleRatingsAction({ authorId: id, limit: 20, includeHidden: true }) : Promise.resolve(null),
  ]);

  if (!data) notFound();
  const { user, totalViews, totalLikes } = data;
  const articles = articlesData.data ?? [];
  const totalArticles = articlesData.total ?? 0;
  const totalArticlePages = articlesData.totalPages ?? 0;

  const avatarUrl = user.image
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name ?? 'User')}&background=e2e8f0&color=0f172a`;

  const followersArr = followersData.success && followersData.data ? followersData.data : [];
  const totalFollowers = followersData.total ?? 0;
  const totalFollowerPages = followersData.totalPages ?? 0;

  // Public profile view for non-owners
  if (!isOwner) {
    return (
      <div className="relative min-h-[calc(100vh-64px)] -mt-[64px] pb-20">
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-primary/10 via-accent-purple/5 to-transparent -z-10" />
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40">
          <PublicProfileClient
            user={{ ...user, avatarUrl, totalViews, totalLikes }}
            articles={articles as any}
            followers={followersArr}
            isFollowing={authorInfo?.isFollowing ?? false}
            followerCount={authorInfo?.followerCount ?? followersArr.length}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] -mt-[64px] pb-20">
      {/* Immersive Cover Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-primary/10 via-accent-purple/5 to-transparent -z-10" />
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40">
        <ProfileClient
          user={{
            ...user,
            avatarUrl,
            totalViews,
            totalLikes,
          }}
          articles={articles as any}
          totalArticles={totalArticles}
          totalArticlePages={totalArticlePages}
          bookmarks={bookmarks as any}
          history={history as any}
          drafts={drafts?.articles as any}
          followers={followersArr}
          totalFollowers={totalFollowers}
          totalFollowerPages={totalFollowerPages}
          isOwner={isOwner}
          canWrite={isOwner && canWrite}
          stats={dashboardStats}
          lastActivity={lastActivity}
          ratingsData={ratingsData}
        />
      </div>
    </div>
  );
}
