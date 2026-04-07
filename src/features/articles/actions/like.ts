'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { createNotificationAction } from '@/features/notifications/actions/notification';

export async function toggleLikeAction(articleId: string): Promise<{ liked: boolean; count: number }> {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) throw new Error('Unauthenticated');

  const existing = await db.like.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });

  if (existing) {
    await db.like.delete({ where: { userId_articleId: { userId, articleId } } });
  } else {
    await db.like.create({ data: { userId, articleId } });

    // Notify tác giả bài viết (nếu không phải chính mình like)
    const article = await db.article.findUnique({
      where: { id: articleId },
      select: { authorId: true, title: true, slug: true },
    });

    if (article && article.authorId !== userId) {
      const likerName = (session.user as { name?: string }).name ?? 'Ai đó';
      await createNotificationAction(
        article.authorId,
        'LIKE',
        `${likerName} đã thích bài viết của bạn`,
        { link: `/article/${article.slug}` },
      );
    }
  }

  const count = await db.like.count({ where: { articleId } });
  return { liked: !existing, count };
}
