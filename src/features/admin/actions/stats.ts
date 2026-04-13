'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ArticleStatus } from '@prisma/client';

async function requireAdmin() {
  const session = await auth();
  const role    = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') throw new Error('Unauthorized');
}

export async function getAdminStatsAction() {
  await requireAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalArticles,
    totalUsers,
    totalViewsResult,
    newCommentsToday,
  ] = await Promise.all([
    db.article.count(),
    db.user.count(),
    db.article.aggregate({ _sum: { viewCount: true } }),
    db.comment.count({ where: { createdAt: { gte: today } } }),
  ]);

  return {
    totalArticles,
    totalUsers,
    totalViews: totalViewsResult._sum.viewCount ?? 0,
    newCommentsToday,
  };
}

export async function getTopArticlesAction(limit = 5) {
  await requireAdmin();
  return db.article.findMany({
    where:   { status: ArticleStatus.PUBLISHED },
    orderBy: { viewCount: 'desc' },
    take:    limit,
    select: {
      id: true, title: true, slug: true, thumbnail: true,
      topic: { select: { id: true, slug: true, label: true, emoji: true, color: true } },
      viewCount: true, publishedAt: true,
      _count: { select: { likes: true, comments: true } },
      author: { select: { name: true, image: true } },
    },
  });
}

export async function getTopAuthorsAction(limit = 5) {
  await requireAdmin();
  const users = await db.user.findMany({
    where:  { articles: { some: { status: ArticleStatus.PUBLISHED } } },
    select: {
      id: true, name: true, image: true,
      _count: { select: { articles: { where: { status: ArticleStatus.PUBLISHED } } } },
      articles: { where: { status: ArticleStatus.PUBLISHED }, select: { viewCount: true } },
    },
  });
  return users
    .map(u => ({
      id:           u.id,
      name:         u.name,
      image:        u.image,
      articleCount: u._count.articles,
      totalViews:   u.articles.reduce((s, a) => s + a.viewCount, 0),
    }))
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, limit);
}
