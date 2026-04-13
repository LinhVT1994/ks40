'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function upsertReadHistoryAction(articleId: string, progress: number) {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return;

  await db.readHistory.upsert({
    where:  { userId_articleId: { userId, articleId } },
    update: { progress, readAt: new Date() },
    create: { userId, articleId, progress },
  });
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
