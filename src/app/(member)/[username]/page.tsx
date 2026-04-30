import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicProfileAction, getProfileArticlesAction } from '@/features/member/actions/profile';
import { getFollowersAction } from '@/features/member/actions/profile-follow';
import { getAuthorInfoAction } from '@/features/member/actions/follow';
import PublicProfileClient from '../profile/[id]/PublicProfileClient';
import JsonLd from '@/components/shared/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

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

  const { user } = data;
  const title       = user.name;
  const description = user.bio ?? `Hồ sơ chuyên gia của ${user.name} trên ${SITE_NAME}. Khám phá các bài viết kiến thức về công nghệ, kiến trúc hệ thống và AI.`;
  const image       = user.image ?? null;

  return {
    title,
    description,
    openGraph: {
      title: `${user.name} | ${SITE_NAME}`,
      description,
      type: 'profile',
      ...(image && { images: [{ url: image, alt: user.name ?? '' }] }),
    },
    twitter: {
      card:  image ? 'summary_large_image' : 'summary',
      title: `${user.name} | ${SITE_NAME}`,
      description,
      ...(image && { images: [image] }),
    },
    alternates: { canonical: `/@${user.username || user.id}` },
  };
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
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-primary/10 via-accent-purple/5 to-transparent -z-10" />
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] -z-10" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40">
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
