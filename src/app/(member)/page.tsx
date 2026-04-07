import { auth } from '@/auth';
import WelcomeSection from '@/features/member/components/WelcomeSection';
import FeatureCards from '@/features/member/components/FeatureCards';
import { getArticlesAction, getPopularTagsAction } from '@/features/articles/actions/article';
import { getSiteConfigAction } from '@/features/admin/actions/config';
import MemberContainer from '@/components/layout/MemberContainer';

export default async function MemberDashboardPage() {
  const session = await auth();
  const user    = session?.user as { role?: string; name?: string } | undefined;
  const isLoggedIn = !!session?.user;

  const [{ articles, totalPages }, tags, categoryConfig] = await Promise.all([
    getArticlesAction({ limit: 20 }),
    getPopularTagsAction(15),
    getSiteConfigAction('article_categories'),
  ]);

  return (
    <MemberContainer>
      <WelcomeSection name={user?.name} />
      <FeatureCards
        initialArticles={articles}
        totalPages={totalPages}
        isLoggedIn={isLoggedIn}
        popularTags={tags}
        categoryConfig={categoryConfig as { value: string; label: string; emoji: string; color: string; enabled: boolean }[] | null}
      />
    </MemberContainer>
  );
}
