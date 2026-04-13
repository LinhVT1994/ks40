'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { startOfDay, subDays, eachDayOfInterval, format } from 'date-fns';

async function requireAdmin() {
  const session = await auth();
  const role    = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') throw new Error('Unauthorized');
}

export async function getOverallGrowthAction() {
  await requireAdmin();

  const thirtyDaysAgo = subDays(new Date(), 30);

  const [articles, users, readActivity] = await Promise.all([
    db.article.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    db.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    db.readHistory.findMany({
      where: { readAt: { gte: thirtyDaysAgo } },
      select: { readAt: true },
    }),
  ]);

  // Generate date interval for the last 30 days
  const interval = eachDayOfInterval({
    start: thirtyDaysAgo,
    end:   new Date(),
  });

  const chartData = interval.map(date => {
    const dStr = format(date, 'yyyy-MM-dd');
    const articlesCount = articles.filter(a => format(a.createdAt, 'yyyy-MM-dd') === dStr).length;
    const usersCount    = users.filter(u => format(u.createdAt, 'yyyy-MM-dd') === dStr).length;
    const activityCount = readActivity.filter(r => format(r.readAt, 'yyyy-MM-dd') === dStr).length;

    return {
      date: format(date, 'dd/MM'),
      articles: articlesCount,
      users:    usersCount,
      activity: activityCount,
    };
  });

  return chartData;
}

export async function getEngagementMetricsAction() {
  await requireAdmin();

  const [totalArticles, totalViewsResult, totalLikes, totalComments] = await Promise.all([
    db.article.count(),
    db.article.aggregate({ _sum: { viewCount: true } }),
    db.like.count(),
    db.comment.count(),
  ]);

  const totalViews = totalViewsResult._sum.viewCount ?? 0;

  return {
    totalArticles,
    totalViews,
    totalLikes,
    totalComments,
    // Derived metrics
    likesPerView:    totalViews > 0 ? (totalLikes / totalViews) * 100 : 0,
    commentsPerView: totalViews > 0 ? (totalComments / totalViews) * 100 : 0,
  };
}

export async function getTopicPerformanceAction() {
  await requireAdmin();

  const topics = await db.topic.findMany({
    include: {
      _count: { select: { articles: true } },
      articles: { select: { viewCount: true, _count: { select: { likes: true, comments: true } } } },
    },
  });

  return topics.map(t => {
    const totalViews = t.articles.reduce((sum, a) => sum + a.viewCount, 0);
    const totalLikes = t.articles.reduce((sum, a) => sum + a._count.likes, 0);
    
    return {
      label:        t.label,
      articleCount: t._count.articles,
      totalViews,
      totalLikes,
      engagement:   t._count.articles > 0 ? (totalViews / t._count.articles) : 0,
      color:        t.color ?? '#3b82f6',
    };
  }).sort((a, b) => b.totalViews - a.totalViews);
}

export async function getDetailedContentStatsAction() {
  await requireAdmin();

  // Get top 20 articles with more details for analytics table
  return db.article.findMany({
    orderBy: { viewCount: 'desc' },
    take:    20,
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      publishedAt: true,
      topic: { select: { label: true, color: true } },
      _count: { select: { likes: true, comments: true, bookmarks: true } },
      author: { select: { name: true } },
    },
  });
}
