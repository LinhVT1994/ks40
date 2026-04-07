'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function toggleBookmarkAction(articleId: string): Promise<{ bookmarked: boolean }> {
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

export async function getBookmarksAction() {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return [];

  const bookmarks = await db.bookmark.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      article: {
        select: {
          id: true, title: true, slug: true, summary: true,
          thumbnail: true, category: true, badges: true,
          readTime: true, viewCount: true, publishedAt: true,
          author: { select: { name: true, image: true } },
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
  });

  return bookmarks.map(b => b.article);
}
