import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticlesAction } from '@/features/articles/actions/article';
import { getTopicBySlugAction, getTopicTreeAction, getTopicFollowStatus } from '@/features/admin/actions/topic';
import type { TopicItem } from '@/features/admin/actions/topic';
import { db } from '@/lib/db';
import TopicPageClient from '@/features/member/components/TopicPageClient';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopicBySlugAction(slug);
  if (!topic) return {};

  const title       = `${topic.label} | ${SITE_NAME}`;
  const description = `Khám phá các bài viết, tài liệu và khoá học về ${topic.label} trên ${SITE_NAME}.`;
  const ogImage     = `${SITE_URL}/og?title=${encodeURIComponent(topic.label)}&topic=${encodeURIComponent(topic.label)}&color=${encodeURIComponent(topic.color ?? '#64748b')}`;

  return {
    title,
    description,
    alternates: { canonical: `/topic/${slug}` },
    robots:     { index: true, follow: true },
    openGraph: {
      type:        'website',
      url:         `${SITE_URL}/topic/${slug}`,
      title,
      description,
      siteName:    SITE_NAME,
      images:      [{ url: ogImage, width: 1200, height: 630, alt: topic.label }],
    },
    twitter: {
      card:   'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const [topic, allTopicsTree] = await Promise.all([
    getTopicBySlugAction(slug),
    getTopicTreeAction(),
  ]);

  if (!topic) notFound();

  // Determine parent/child relationship
  const isParent = !topic.parentId;
  let children: TopicItem[] = [];
  let parentTopic: TopicItem | null = null;

  if (isParent) {
    const treeNode = allTopicsTree.find(t => t.id === topic.id);
    children = (treeNode?.children ?? []).filter(c => c.enabled);
    parentTopic = topic;
  } else {
    const parent = allTopicsTree.find(t => t.id === topic.parentId);
    if (parent) {
      parentTopic = parent;
      children = (parent.children ?? []).filter(c => c.enabled);
    }
  }

  // Follow the specific topic being viewed (more granular and matches user expectation for sidebar)
  const followTopicId = topic.id;
  const [{ articles, totalPages, total }, followStatus, childCounts] = await Promise.all([
    getArticlesAction({ topicId: topic.id, limit: 20 }),
    getTopicFollowStatus(followTopicId),
    children.length > 0
      ? db.topic.findMany({
          where: { id: { in: children.map(c => c.id) } },
          select: { id: true, _count: { select: { articles: true } } },
        })
      : Promise.resolve([]),
  ]);

  const childCountMap: Record<string, number> = {};
  for (const c of childCounts) childCountMap[c.id] = c._count.articles;

  return (
    <TopicPageClient
      topic={isParent ? topic : { ...topic, emoji: parentTopic?.emoji ?? topic.emoji }}
      parentTopic={parentTopic}
      children={children}
      childCounts={childCountMap}
      isParent={isParent}
      currentSlug={slug}
      initialArticles={articles}
      totalPages={totalPages}
      totalArticles={total}
      isLoggedIn={isLoggedIn}
      initialFollowing={followStatus.isFollowing}
      followerCount={followStatus.followerCount}
      followTopicId={followTopicId}
    />
  );
}
