'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function upsertReadHistoryAction(articleId: string, progress: number) {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return;

  // Chỉ tăng progress, không bao giờ ghi đè lùi
  const existing = await db.readHistory.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });

  if (!existing) {
    await db.readHistory.create({ data: { userId, articleId, progress } });
    return;
  }

  if (progress > existing.progress) {
    await db.readHistory.update({
      where: { userId_articleId: { userId, articleId } },
      data:  { progress, readAt: new Date() },
    });
  } else {
    // Chỉ refresh readAt để bài lên đầu lịch sử
    await db.readHistory.update({
      where: { userId_articleId: { userId, articleId } },
      data:  { readAt: new Date() },
    });
  }
}

export async function markArticleOpenedAction(articleId: string): Promise<{ progress: number }> {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return { progress: 0 };

  const existing = await db.readHistory.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });

  if (!existing) {
    await db.readHistory.create({ data: { userId, articleId, progress: 0.02 } });
    return { progress: 0.02 };
  }

  // Chỉ refresh readAt, KHÔNG đụng vào progress
  await db.readHistory.update({
    where: { userId_articleId: { userId, articleId } },
    data:  { readAt: new Date() },
  });
  return { progress: existing.progress };
}

export async function getReadHistoryAction() {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return [];

  return db.readHistory.findMany({
    where:   { userId },
    orderBy: { readAt: 'desc' },
    take:    20,
    include: {
      article: {
        select: {
          id: true, title: true, slug: true, thumbnail: true, thumbnailPosition: true, 
          cover: true, coverPosition: true, summary: true,
          topic: { select: { id: true, slug: true, label: true, emoji: true, color: true, parentId: true, parent: { select: { id: true, slug: true, label: true } } } },
          audience: true, badges: true,
          readTime: true, viewCount: true, publishedAt: true,
          author: { select: { name: true, image: true } },
          _count: { select: { likes: true, comments: true, bookmarks: true } },
        },
      },
    },
  });
}
