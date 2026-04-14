import type { Metadata } from 'next';
import { auth } from '@/auth';
import WelcomeSection from '@/features/member/components/WelcomeSection';
import FeatureCards from '@/features/member/components/FeatureCards';
import { getArticlesAction, getPopularTagsAction, getForYouArticlesAction } from '@/features/articles/actions/article';
import { getEnabledTopicsAction } from '@/features/admin/actions/topic';
import { getPreferencesAction } from '@/features/onboarding/actions/onboarding';
import { getReadHistoryAction } from '@/features/articles/actions/read-history';
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

  // Render Landing Page for guest users
  if (!isLoggedIn) {
    return <LandingPage />;
  }

  // Source of truth: Fetch followed topic IDs from TopicFollow table
  const followedIds = session.user?.id
    ? (await (db as any).topicFollow.findMany({
        where: { userId: session.user.id },
        select: { topicId: true }
      })).map((f: { topicId: string }) => f.topicId)
    : [];

  const [tags, allTopics, prefs, history] = await Promise.all([
    getPopularTagsAction(15),
    getEnabledTopicsAction(),
    getPreferencesAction().catch(() => null),
    getReadHistoryAction().catch(() => []),
  ]);
  
  const explicitlyFollowed = allTopics.filter(t => followedIds.includes(t.id));
  const followedSet = new Set(followedIds);
  
  // 1. Add explicitly followed topics
  let curatedTopics = [...explicitlyFollowed];

  // 2. Automatically include children of followed parent topics
  explicitlyFollowed.forEach(parent => {
    if (!parent.parentId) { // If it's a parent
      const children = allTopics.filter(t => t.parentId === parent.id && !followedSet.has(t.id));
      curatedTopics.push(...children);
    }
  });

  // 3. Fallback: If still sparse (< 6), add popular global topics
  if (curatedTopics.length < 6) {
    const existingIds = new Set(curatedTopics.map(t => t.id));
    const popularFallbacks = [...allTopics]
      .filter(t => !existingIds.has(t.id))
      .sort((a, b) => (b._count?.articles ?? 0) - (a._count?.articles ?? 0))
      .slice(0, 6 - curatedTopics.length);
    curatedTopics.push(...popularFallbacks);
  }
  
  curatedTopics = curatedTopics.slice(0, 20);

  // Personalized/Followed Articles
  const { articles: followedArticles, totalPages: followedTotalPages } = await getForYouArticlesAction({ 
    limit: 20 
  });

  // Discovery Articles
  const { articles: discoveryArticles, totalPages: discoveryTotalPages } = await getArticlesAction({ 
    limit: 20 
  });

  return (
    <MemberContainer>
      <WelcomeSection name={user?.name} />
      <FeatureCards
        initialFollowedArticles={followedArticles}
        initialFollowedTotalPages={followedTotalPages}
        initialDiscoveryArticles={discoveryArticles}
        initialDiscoveryTotalPages={discoveryTotalPages}
        isLoggedIn={isLoggedIn}
        popularTags={tags}
        topicIds={followedIds}
        topics={curatedTopics}
        currentUserId={user?.id}
        initialHistory={history as any}
        initialFeed="discovery"
      />
    </MemberContainer>
  );
}
