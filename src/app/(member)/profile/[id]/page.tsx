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
  return {
    alternates: { canonical: `/@${user.username || user.id}` },
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const data = await getPublicProfileAction(id);
  if (!data) notFound();
  
  const { user } = data;
  
  // Always redirect to the new format
  redirect(`/@${user.username || user.id}`);
}
