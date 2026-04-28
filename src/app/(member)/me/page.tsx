import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getBookmarksAction } from '@/features/articles/actions/bookmark';
import { getReadHistoryAction } from '@/features/articles/actions/read-history';
import { getMemberDraftsAction } from '@/features/member/actions/write';
import { getFollowersAction, getFollowingAction } from '@/features/member/actions/profile-follow';
import { getProfileArticlesAction, getPublicProfileAction } from '@/features/member/actions/profile';
import { getArticleRatingsAction } from '@/features/articles/actions/rating';
import ProfileClient from '../profile/[id]/ProfileClient';
import JsonLd from '@/components/shared/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export default async function PersonalDashboardPage() {
  const session = await auth();
  const currentUserId = session?.user?.id;
  const userRole = (session?.user as { role?: string })?.role;
  const canWrite = (session?.user as { canWrite?: boolean })?.canWrite || userRole === 'ADMIN';

  if (!currentUserId) {
    redirect('/login');
  }

  // Fetch full profile data for the current user
  const data = await getPublicProfileAction(currentUserId);
  if (!data) redirect('/login');
  
  const { user, totalViews, totalLikes } = data;

  const [
    bookmarks, history, drafts, followersData, followingData,
    articlesData, ratingsData
  ] = await Promise.all([
    getBookmarksAction(),
    getReadHistoryAction(),
    canWrite ? getMemberDraftsAction() : Promise.resolve(null),
    getFollowersAction(user.id),
    getFollowingAction(user.id),
    getProfileArticlesAction(user.id),
    canWrite ? getArticleRatingsAction({ authorId: user.id, limit: 20, includeHidden: true }) : Promise.resolve(null),
  ]);

  const profileUrl = `${SITE_URL}/me`;
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type':    'Person',
    name:       user.name,
    description: user.bio,
    image:      user.image,
    url:        profileUrl,
    worksFor: {
      '@type': 'Organization',
      name:    SITE_NAME,
    },
  };

  const articles = articlesData.data ?? [];
  const totalArticles = articlesData.total ?? 0;
  const totalArticlePages = articlesData.totalPages ?? 0;

  const avatarUrl = user.image
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name ?? 'User')}&background=e2e8f0&color=0f172a`;

  const followersArr = followersData.success && followersData.data ? followersData.data : [];
  const totalFollowers = followersData.total ?? 0;
  const totalFollowerPages = followersData.totalPages ?? 0;

  const followingArr = followingData.success && followingData.data ? followingData.data : [];
  const totalFollowing = followingData.total ?? 0;
  const totalFollowingPages = followingData.totalPages ?? 0;

  return (
    <div className="relative min-h-[calc(100vh-64px)] -mt-[64px] pb-20">
      <JsonLd data={personJsonLd} />
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-primary/10 via-accent-purple/5 to-transparent -z-10" />
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] -z-10" />

      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 pt-32 sm:pt-40">
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
          following={followingArr}
          totalFollowing={totalFollowing}
          totalFollowingPages={totalFollowingPages}
          isOwner={true}
          canWrite={canWrite}
          ratingsData={ratingsData}
        />
      </div>
    </div>
  );
}
