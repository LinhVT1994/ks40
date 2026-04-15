import { auth } from '@/auth';
import { getArticlesAction, getForYouArticlesAction } from '@/features/articles/actions/article';
import { getReadHistoryAction } from '@/features/articles/actions/read-history';
import FeatureCards from './FeatureCards';
import type { TopicItem } from '@/features/admin/actions/topic';

interface FeedLoaderProps {
  isLoggedIn: boolean;
  popularTags: { id: string; name: string; slug: string; count: number }[];
  topicIds: string[];
  topics: TopicItem[];
  currentUserId?: string;
}

export default async function FeedLoader({
  isLoggedIn,
  popularTags,
  topicIds,
  topics,
  currentUserId,
}: FeedLoaderProps) {
  // Re-use session from Next.js request cache — no extra DB round-trip
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const userId = session?.user?.id;

  // All heavy fetches happen here — isolated from the page shell
  // Pass userId/role to avoid duplicate auth() calls inside each action
  const [
    { articles: followedArticles, totalPages: followedTotalPages },
    { articles: discoveryArticles, totalPages: discoveryTotalPages },
    history,
  ] = await Promise.all([
    getForYouArticlesAction({ limit: 20, userId, role }),
    getArticlesAction({ limit: 20 }),
    getReadHistoryAction().catch(() => []),
  ]);

  return (
    <FeatureCards
      initialFollowedArticles={followedArticles}
      initialFollowedTotalPages={followedTotalPages}
      initialDiscoveryArticles={discoveryArticles}
      initialDiscoveryTotalPages={discoveryTotalPages}
      isLoggedIn={isLoggedIn}
      popularTags={popularTags}
      topicIds={topicIds}
      topics={topics}
      currentUserId={currentUserId}
      initialHistory={history as any}
      initialFeed="discovery"
    />
  );
}
