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
          id: true, title: true, slug: true, thumbnail: true,
          category: true, readTime: true,
          author: { select: { name: true } },
        },
      },
    },
  });
}
