'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { eventBus, EVENTS } from '@/lib/events/bus';
import { createNotificationAction } from '@/features/notifications/actions/notification';
import { revalidatePath } from 'next/cache';

// ─── Types ──────────────────────────────────────────────────

export type RatingSummary = {
  averageScore: number;
  totalCount: number;
  distribution: [number, number, number, number, number]; // 1★→5★
  userRating: { score: number; review: string | null } | null;
  canRate: {
    eligible: boolean;
    reason?: 'unauthenticated' | 'is_author' | 'not_enough_progress';
    progress?: number;
  };
};

export type RatingItem = {
  userId: string;
  score: number;
  review: string | null;
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string; image: string | null };
};

// ─── 1. Get summary for article page ────────────────────────

export async function getArticleRatingSummaryAction(articleId: string): Promise<RatingSummary> {
  const session = await auth();
  const userId = session?.user?.id;

  // Aggregate stats (exclude hidden from public stats)
  const [ratings, userRating, article, readHistory] = await Promise.all([
    db.articleRating.findMany({
      where: { articleId, hidden: false },
      select: { score: true },
    }),
    userId
      ? db.articleRating.findUnique({
          where: { userId_articleId: { userId, articleId } },
          select: { score: true, review: true },
        })
      : null,
    db.article.findUnique({
      where: { id: articleId },
      select: { authorId: true },
    }),
    userId
      ? db.readHistory.findUnique({
          where: { userId_articleId: { userId, articleId } },
          select: { progress: true },
        })
      : null,
  ]);

  const totalCount = ratings.length;
  const averageScore =
    totalCount > 0
      ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / totalCount) * 100) / 100
      : 0;

  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const r of ratings) {
    distribution[r.score - 1]++;
  }

  // Determine eligibility
  let canRate: RatingSummary['canRate'];
  if (!userId) {
    canRate = { eligible: false, reason: 'unauthenticated' };
  } else if (article?.authorId === userId) {
    canRate = { eligible: false, reason: 'is_author' };
  } else if (!readHistory || readHistory.progress < 0.7) {
    canRate = { eligible: false, reason: 'not_enough_progress', progress: Math.round((readHistory?.progress ?? 0) * 100) };
  } else {
    canRate = { eligible: true };
  }

  return {
    averageScore,
    totalCount,
    distribution,
    userRating: userRating ? { score: userRating.score, review: userRating.review } : null,
    canRate,
  };
}

// ─── 2. Upsert rating ──────────────────────────────────────

export async function upsertRatingAction(
  articleId: string,
  score: number,
  review?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: 'Bạn cần đăng nhập.' };

  // Validate score
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return { success: false, error: 'Điểm đánh giá phải từ 1 đến 5.' };
  }

  // Validate review length
  const trimmedReview = review?.trim() || null;
  if (trimmedReview && trimmedReview.length > 300) {
    return { success: false, error: 'Nhận xét tối đa 300 ký tự.' };
  }

  // Check article exists + not author
  const article = await db.article.findUnique({
    where: { id: articleId },
    select: { authorId: true, title: true, slug: true },
  });
  if (!article) return { success: false, error: 'Bài viết không tồn tại.' };
  if (article.authorId === userId) {
    return { success: false, error: 'Bạn không thể đánh giá bài viết của chính mình.' };
  }

  // Check read progress >= 70% (DB stores 0..1)
  const readHistory = await db.readHistory.findUnique({
    where: { userId_articleId: { userId, articleId } },
    select: { progress: true },
  });
  if (!readHistory || readHistory.progress < 0.7) {
    return { success: false, error: 'Bạn cần đọc ít nhất 70% bài viết trước khi đánh giá.' };
  }

  // Check if this is a new rating or update
  const existing = await db.articleRating.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });
  const isNew = !existing;

  // Upsert
  await db.articleRating.upsert({
    where: { userId_articleId: { userId, articleId } },
    create: { userId, articleId, score, review: trimmedReview },
    update: { score, review: trimmedReview },
  });

  // Notification only for NEW ratings (not updates)
  if (isNew) {
    const raterName = (session.user as { name?: string }).name ?? 'Ai đó';

    eventBus.emit(EVENTS.RATING_POSTED, {
      articleId,
      articleTitle: article.title,
      articleSlug: article.slug,
      score,
      raterName,
      actorId: userId,
    });

    void createNotificationAction(
      article.authorId,
      'RATING',
      `${raterName} đã đánh giá bài viết của bạn ${score} sao`,
      {
        message: trimmedReview
          ? `"${trimmedReview.slice(0, 80)}${trimmedReview.length > 80 ? '...' : ''}"`
          : undefined,
        link: `/article/${article.slug}`,
      },
    );
  }

  revalidatePath(`/article/${article.slug}`);
  return { success: true };
}

// ─── 3. Delete own rating ───────────────────────────────────

export async function deleteRatingAction(
  articleId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: 'Bạn cần đăng nhập.' };

  const existing = await db.articleRating.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });
  if (!existing) return { success: false, error: 'Không tìm thấy đánh giá.' };

  await db.articleRating.delete({
    where: { userId_articleId: { userId, articleId } },
  });

  const article = await db.article.findUnique({
    where: { id: articleId },
    select: { slug: true },
  });
  if (article) revalidatePath(`/article/${article.slug}`);

  return { success: true };
}

// ─── 4. Admin: hide/unhide rating ──────────────────────────

export async function toggleHideRatingAction(
  userId: string,
  articleId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') return { success: false, error: 'Không có quyền.' };

  const rating = await db.articleRating.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });
  if (!rating) return { success: false, error: 'Không tìm thấy đánh giá.' };

  await db.articleRating.update({
    where: { userId_articleId: { userId, articleId } },
    data: { hidden: !rating.hidden },
  });

  const article = await db.article.findUnique({
    where: { id: articleId },
    select: { slug: true },
  });
  if (article) revalidatePath(`/article/${article.slug}`);

  return { success: true };
}

// ─── 5. Admin: delete any rating ────────────────────────────

export async function deleteRatingAdminAction(
  userId: string,
  articleId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') return { success: false, error: 'Không có quyền.' };

  const existing = await db.articleRating.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });
  if (!existing) return { success: false, error: 'Không tìm thấy đánh giá.' };

  await db.articleRating.delete({
    where: { userId_articleId: { userId, articleId } },
  });

  const article = await db.article.findUnique({
    where: { id: articleId },
    select: { slug: true },
  });
  if (article) revalidatePath(`/article/${article.slug}`);

  return { success: true };
}

// ─── 6. Get ratings list (for author dashboard / admin) ─────

export async function getArticleRatingsAction(options: {
  articleId?: string;
  authorId?: string;
  page?: number;
  limit?: number;
  includeHidden?: boolean;
} = {}): Promise<{
  ratings: RatingItem[];
  totalCount: number;
  hasNextPage: boolean;
  averageScore: number;
  totalRatedArticles: number;
}> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ratings: [], totalCount: 0, hasNextPage: false, averageScore: 0, totalRatedArticles: 0 };

  const { page = 1, limit = 20, articleId, authorId, includeHidden = false } = options;
  const skip = (page - 1) * limit;

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === 'ADMIN';

  // Only admin or the author themselves can see hidden ratings
  const where: any = {};
  if (articleId) where.articleId = articleId;
  if (authorId) where.article = { authorId };
  if (!includeHidden || !isAdmin) where.hidden = false;

  const [ratings, totalCount] = await Promise.all([
    db.articleRating.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    }),
    db.articleRating.count({ where }),
  ]);

  // Aggregate stats for author dashboard
  const statsWhere: any = {};
  if (authorId) statsWhere.article = { authorId };
  if (!includeHidden || !isAdmin) statsWhere.hidden = false;

  const allScores = await db.articleRating.findMany({
    where: statsWhere,
    select: { score: true, articleId: true },
  });

  const avg = allScores.length > 0
    ? Math.round((allScores.reduce((s, r) => s + r.score, 0) / allScores.length) * 100) / 100
    : 0;

  const uniqueArticles = new Set(allScores.map(r => r.articleId));

  return {
    ratings: ratings as RatingItem[],
    totalCount,
    hasNextPage: totalCount > skip + ratings.length,
    averageScore: avg,
    totalRatedArticles: uniqueArticles.size,
  };
}
