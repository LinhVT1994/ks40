'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ArticleStatus } from '@prisma/client';

export async function getPublicProfileAction(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          articles: { where: { status: ArticleStatus.PUBLISHED } },
        },
      },
    },
  });

  if (!user) return null;

  const articles = await db.article.findMany({
    where: { authorId: userId, status: ArticleStatus.PUBLISHED },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true, title: true, slug: true, summary: true,
      thumbnail: true, thumbnailPosition: true,
      category: true, badges: true, readTime: true,
      viewCount: true, publishedAt: true,
      _count: { select: { likes: true, comments: true } },
    },
  });

  const totalViews = articles.reduce((s, a) => s + a.viewCount, 0);
  const totalLikes = articles.reduce((s, a) => s + a._count.likes, 0);

  return { user, articles, totalViews, totalLikes };
}

export async function updateProfileAction(data: { name?: string; bio?: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const user = await db.user.update({
      where: { id: userId },
      data,
    });
    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Lỗi cập nhật hồ sơ' };
  }
}
