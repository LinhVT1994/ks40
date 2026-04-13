import { auth } from '@/auth';
import WelcomeSection from '@/features/member/components/WelcomeSection';
import FeatureCards from '@/features/member/components/FeatureCards';
import { getArticlesAction, getPopularTagsAction } from '@/features/articles/actions/article';
import { getEnabledTopicsAction } from '@/features/admin/actions/topic';
import { getReadHistoryAction } from '@/features/articles/actions/read-history';
import MemberContainer from '@/components/layout/MemberContainer';

export default async function ExplorePage() {
  const session = await auth();
  const user    = session?.user as { role?: string; name?: string; id?: string } | undefined;
  const isLoggedIn = !!session?.user;

  // For Explore page, we always show the "Public Discovery" view
  // even if logged in, but we pass the actual login status to the components
  
  const [tags, allTopics, history] = await Promise.all([
    getPopularTagsAction(15),
    getEnabledTopicsAction(),
    isLoggedIn ? getReadHistoryAction().catch(() => []) : Promise.resolve([]),
  ]);
  
  // Guest-style curated topics (Top 10 by article count)
  const curatedTopics = [...allTopics]
    .sort((a, b) => (b._count?.articles ?? 0) - (a._count?.articles ?? 0))
    .slice(0, 15);

  // Discovery Articles (Strictly newest articles)
  const { articles: discoveryArticles, totalPages: discoveryTotalPages } = await getArticlesAction({ 
    limit: 20 
  });

  return (
    <MemberContainer>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-zinc-800 dark:text-white uppercase tracking-tight font-display mb-2">
          Khám phá <span className="text-primary text-xl md:text-2xl align-top">★</span>
        </h1>
        <p className="text-zinc-500 dark:text-slate-400 font-medium">
          Tìm kiếm cảm hứng và tri thức mới từ cộng đồng Lenote.
        </p>
      </div>

      <FeatureCards
        key="explore-feed"
        // For /explore, we default to the "Discovery" (Khám phá) tab as the primary
        initialFollowedArticles={[]} // Not needed if we default to discovery tab
        initialFollowedTotalPages={0}
        initialDiscoveryArticles={discoveryArticles}
        initialDiscoveryTotalPages={discoveryTotalPages}
        isLoggedIn={isLoggedIn}
        popularTags={tags}
        topicIds={[]} // Guests don't have followed topics
        topics={curatedTopics}
        currentUserId={user?.id}
        initialHistory={history as any}
        initialFeed="discovery"
      />
    </MemberContainer>
  );
}
