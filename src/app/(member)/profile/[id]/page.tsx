import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Calendar, FileText, Eye, Heart } from 'lucide-react';
import { getPublicProfileAction, getProfileArticlesAction } from '@/features/member/actions/profile';
import { getBookmarksAction } from '@/features/articles/actions/bookmark';
import { getReadHistoryAction } from '@/features/articles/actions/read-history';
import { getMemberDraftsAction } from '@/features/member/actions/write';
import { getFollowersAction, getFollowingAction } from '@/features/member/actions/profile-follow';
import { getAuthorInfoAction } from '@/features/member/actions/follow';
import { getDashboardStatsAction, getContinueReadingAction } from '@/features/member/actions/dashboard';
import { getArticleRatingsAction } from '@/features/articles/actions/rating';
import { getEnabledTopicsAction } from '@/features/admin/actions/topic';
import { db } from '@/lib/db';
import ProfileClient from './ProfileClient';
import PublicProfileClient from './PublicProfileClient';
import JsonLd from '@/components/shared/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

function formatViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicProfileAction(id);
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
    alternates: { canonical: `/profile/${user.username ?? id}` },
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;

  // Fetch profile data first
  const data = await getPublicProfileAction(id);
  if (!data) notFound();
  
  const { user, totalViews, totalLikes } = data;

  // Canonical redirect: if accessing by ID and user has username → redirect to /profile/[username]
  if (user.username && id !== user.username) {
    redirect(`/profile/${user.username}`);
  }

  // REDIRECT TO DASHBOARD IF OWNER
  if (currentUserId === user.id) {
    redirect('/me');
  }

  const [
    followersData, authorInfo, articlesData
  ] = await Promise.all([
    getFollowersAction(user.id),
    getAuthorInfoAction(user.id, currentUserId),
    getProfileArticlesAction(user.id),
  ]);

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type':    'Person',
    name:       user.name,
    description: user.bio,
    image:      user.image,
    url:        `${SITE_URL}/profile/${user.username ?? id}`,
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

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40">
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
