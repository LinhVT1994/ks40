import { Suspense } from 'react';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import WelcomeSection from '@/features/member/components/WelcomeSection';
import FeedLoader from '@/features/member/components/FeedLoader';
import FeedSkeleton from '@/features/member/components/FeedSkeleton';
import { getPopularTagsAction } from '@/features/articles/actions/article';
import { getEnabledTopicsAction } from '@/features/admin/actions/topic';
import MemberContainer from '@/components/layout/MemberContainer';
import { db } from '@/lib/db';
import LandingPage from '@/features/landing/components/LandingPage';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title:       { 
    absolute: `${SITE_NAME} — Học công nghệ đỉnh cao: System Design, AI/ML, DevOps` 
  },
  description: `${SITE_NAME} là nền tảng học tập công nghệ tinh gọn dành cho kỹ sư. Chuyên sâu về System Design, AI/ML, DevOps, Frontend và Backend với bài viết chất lượng cao từ chuyên gia thực chiến.`,
  alternates:  { canonical: '/' },
  openGraph: {
    type:        'website',
    url:         SITE_URL,
    siteName:    SITE_NAME,
    title:       `${SITE_NAME} — Nền tảng học công nghệ đỉnh cao`,
    description: `Khám phá lộ trình học System Design, AI/ML, DevOps và kiến trúc hệ thống chuyên sâu trên ${SITE_NAME}.`,
    images:      [{ url: '/logo.png', width: 1200, height: 1200, alt: SITE_NAME }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       `${SITE_NAME} — Nền tảng học công nghệ đỉnh cao`,
    description: `Khám phá lộ trình học System Design, AI/ML, DevOps và kiến trúc hệ thống chuyên sâu trên ${SITE_NAME}.`,
    images:      ['/logo.png'],
  },
};

export default async function MemberDashboardPage() {
  const session = await auth();
  const user    = session?.user as { role?: string; name?: string; id?: string } | undefined;
  const isLoggedIn = !!session?.user;

  // Render Landing Page for guest users — no data needed
  if (!isLoggedIn) {
    return <LandingPage />;
  }

  // ── Lightweight fetches only (fast, don't block shell render) ─────────────────
  // These 3 queries run in parallel and are typically fast (<50ms)
  const [followedIds, tags, allTopics] = await Promise.all([
    session.user?.id
      ? (db as any).topicFollow.findMany({
          where: { userId: session.user.id },
          select: { topicId: true },
        }).then((rows: { topicId: string }[]) => rows.map(r => r.topicId))
      : Promise.resolve([] as string[]),
    getPopularTagsAction(15),
    getEnabledTopicsAction(),
  ]);

  // ── Build curated topic list ──────────────────────────────────────────────────
  const explicitlyFollowed = allTopics.filter(t => followedIds.includes(t.id));
  const followedSet = new Set(followedIds);

  // 1. Start with explicitly followed topics
  let curatedTopics = [...explicitlyFollowed];

  // 2. Auto-include children of followed parent topics
  explicitlyFollowed.forEach(parent => {
    if (!parent.parentId) {
      const children = allTopics.filter(t => t.parentId === parent.id && !followedSet.has(t.id));
      curatedTopics.push(...children);
    }
  });

  // 3. Fallback: fill with popular topics if < 6
  if (curatedTopics.length < 6) {
    const existingIds = new Set(curatedTopics.map(t => t.id));
    const popularFallbacks = [...allTopics]
      .filter(t => !existingIds.has(t.id))
      .sort((a, b) => (b._count?.articles ?? 0) - (a._count?.articles ?? 0))
      .slice(0, 6 - curatedTopics.length);
    curatedTopics.push(...popularFallbacks);
  }

  curatedTopics = curatedTopics.slice(0, 20);

  return (
    <MemberContainer>
      {/* Shell renders immediately — user sees welcome section right away */}
      <WelcomeSection name={user?.name} />

      {/* Heavy article fetches stream in via Suspense — TTFB is not blocked */}
      <Suspense fallback={<FeedSkeleton />}>
        <FeedLoader
          isLoggedIn={isLoggedIn}
          popularTags={tags}
          topicIds={followedIds}
          topics={curatedTopics}
          currentUserId={user?.id}
        />
      </Suspense>
    </MemberContainer>
  );
}
