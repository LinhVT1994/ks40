import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicProfileAction, getProfileArticlesAction } from '@/features/member/actions/profile';
import { getFollowersAction } from '@/features/member/actions/profile-follow';
import { getAuthorInfoAction } from '@/features/member/actions/follow';
import PublicProfileClient from '../profile/[id]/PublicProfileClient';
import ProfileCover from '@/features/member/components/ProfileCover';
import JsonLd from '@/components/shared/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import { profileMetadata } from '@/lib/profile-og';

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  
  // Only handle routes starting with @
  if (!username.startsWith('%40') && !username.startsWith('@')) {
    return {};
  }

  const actualUsername = decodeURIComponent(username).substring(1);
  const data = await getPublicProfileAction(actualUsername);
  if (!data) return {};

  return profileMetadata(data.user);
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  
  // Validation: Must start with @
  const decodedUsername = decodeURIComponent(username);
  if (!decodedUsername.startsWith('@')) {
    notFound();
  }

  const identifier = decodedUsername.substring(1);
  const session = await auth();
  const currentUserId = session?.user?.id;

  // Fetch profile data
  const data = await getPublicProfileAction(identifier);
  if (!data) notFound();
  
  const { user, totalViews, totalLikes } = data;

  // Redirect to canonical @username if accessing by ID and user has a username
  if (user.username && identifier !== user.username) {
    redirect(`/@${user.username}`);
  }

  // REDIRECT TO DASHBOARD IF OWNER
  if (currentUserId === user.id) {
    redirect('/me');
  }

  const [
    followersData, authorInfo, articlesData
  ] = await Promise.all([
    getFollowersAction(user.id),
    getAuthorInfoAction(user.id),
    getProfileArticlesAction(user.id),
  ]);

  const sameAs = [
    user.facebookUrl,
    user.instagramUrl,
    user.twitterUrl,
    user.linkedinUrl,
    user.githubUrl,
    user.youtubeUrl,
    user.websiteUrl,
  ].filter(Boolean);

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type':    'Person',
    name:       user.name,
    description: user.bio,
    image:      user.image,
    url:        `${SITE_URL}/@${user.username || user.id}`,
    ...(sameAs.length > 0 && { sameAs }),
    worksFor: {
      '@type': 'Organization',
      name:    SITE_NAME,
    },
  };

  const articles = articlesData.data ?? [];
  const avatarUrl = user.image
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name ?? 'User')}&background=e2e8f0&color=0f172a`;

  const followersArr = followersData.success && followersData.data ? followersData.data : [];

  return (
    <div className="relative min-h-[calc(100vh-64px)] -mt-[64px] pb-20">
      <JsonLd data={personJsonLd} />
      <ProfileCover cover={user.coverImage} />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-44 sm:pt-56">
        <PublicProfileClient
          user={{
            ...user,
            avatarUrl,
            totalViews,
            totalLikes,
            _count: (user as any)._count || { articles: 0 },
          } as any}
          articles={articles as any}
          followers={followersArr}
          isFollowing={authorInfo?.isFollowing ?? false}
          followerCount={authorInfo?.followerCount ?? followersArr.length}
        />
      </div>
    </div>
  );
}
