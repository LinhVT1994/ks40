'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ArticleCard } from './article';

export async function toggleBookmarkAction(articleId: string): Promise<{ bookmarked: boolean }> {
  if (typeof articleId !== 'string' || !/^[a-z0-9]{10,32}$/i.test(articleId)) {
    throw new Error('Invalid articleId');
  }

  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) throw new Error('Unauthenticated');

  const existing = await db.bookmark.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });

  if (existing) {
    await db.bookmark.delete({ where: { userId_articleId: { userId, articleId } } });
  } else {
    await db.bookmark.create({ data: { userId, articleId } });
  }

  return { bookmarked: !existing };
}

export async function getBookmarksAction(options: {
  limit?: number;
  page?: number;
  timeframe?: 'today' | 'week' | 'month' | 'year' | 'all'
} = {}): Promise<{ articles: ArticleCard[]; total: number; totalPages: number; page: number }> {
  const session = await auth();
  const userId  = session?.user?.id;
  const { limit = 20, page = 1, timeframe = 'all' } = options;
  if (!userId) return { articles: [], total: 0, totalPages: 0, page };

  const skip = (page - 1) * limit;

  // Build date filter for article publication date
  let dateFilter: { gte: Date } | undefined = undefined;
  if (timeframe !== 'all') {
    const now = new Date();
    const gteDate = new Date();
    if (timeframe === 'today') gteDate.setHours(0, 0, 0, 0);
    else if (timeframe === 'week') gteDate.setDate(now.getDate() - 7);
    else if (timeframe === 'month') gteDate.setMonth(now.getMonth() - 1);
    else if (timeframe === 'year') gteDate.setFullYear(now.getFullYear() - 1);
    dateFilter = { gte: gteDate };
  }

  const [total, bookmarks] = await Promise.all([
    db.bookmark.count({ 
      where: { 
        userId,
        article: dateFilter ? { publishedAt: dateFilter } : undefined
      } 
    }),
    db.bookmark.findMany({
      where: { 
        userId,
        article: dateFilter ? { publishedAt: dateFilter } : undefined
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        article: {
          select: {
            id: true, title: true, slug: true, summary: true, thumbnail: true, thumbnailPosition: true,
            topic: { select: { id: true, slug: true, label: true, emoji: true, color: true } },
            badges: true, readTime: true, viewCount: true, publishedAt: true,
            author: { select: { name: true, image: true } },
            _count: { select: { likes: true, comments: true } },
            likes:     userId ? { where: { userId }, select: { userId: true } } : false,
            bookmarks: userId ? { where: { userId }, select: { userId: true } } : false,
          },
        },
      },
    }),
  ]);

  const articles = bookmarks.map(b => ({
    ...(b.article as any),
    isLiked:      (b.article as any).likes?.length > 0,
    isBookmarked: true, // It's from the bookmark table for this user
  })) as ArticleCard[];

  return {
    articles,
    total,
    totalPages: Math.ceil(total / limit),
    page,
  };
}
