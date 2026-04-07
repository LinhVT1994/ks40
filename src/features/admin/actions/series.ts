'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ArticleAudience } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export type SeriesFormData = {
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  audience: ArticleAudience;
};

export type SeriesSummary = {
  id: string;
  title: string;
  slug: string;
  audience: ArticleAudience;
  thumbnail: string | null;
  _count: { articles: number };
};

type ActionResult = { success: true; id: string } | { success: false; error: string };

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') throw new Error('Unauthorized');
  return session!.user!;
}

export async function getAllSeriesAction(): Promise<SeriesSummary[]> {
  await requireAdmin();
  return db.series.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      audience: true,
      thumbnail: true,
      _count: { select: { articles: true } },
    },
  });
}

export async function getSeriesAction(id: string) {
  await requireAdmin();
  return db.series.findUnique({
    where: { id },
    include: {
      articles: {
        orderBy: { seriesOrder: 'asc' },
        select: { id: true, title: true, slug: true, seriesOrder: true, status: true, publishedAt: true },
      },
    },
  });
}

export async function createSeriesAction(data: SeriesFormData): Promise<ActionResult> {
  await requireAdmin();
  const existing = await db.series.findUnique({ where: { slug: data.slug } });
  if (existing) return { success: false, error: 'Slug đã tồn tại.' };

  const series = await db.series.create({
    data: {
      title:       data.title,
      slug:        data.slug,
      description: data.description,
      thumbnail:   data.thumbnail,
      audience:    data.audience,
    },
  });
  revalidatePath('/admin/series');
  return { success: true, id: series.id };
}

export async function updateSeriesAction(id: string, data: Partial<SeriesFormData>): Promise<ActionResult> {
  await requireAdmin();
  const series = await db.series.findUnique({ where: { id } });
  if (!series) return { success: false, error: 'Series không tồn tại.' };

  if (data.slug && data.slug !== series.slug) {
    const existing = await db.series.findUnique({ where: { slug: data.slug } });
    if (existing) return { success: false, error: 'Slug đã tồn tại.' };
  }

  await db.series.update({
    where: { id },
    data: {
      ...(data.title       !== undefined && { title:       data.title }),
      ...(data.slug        !== undefined && { slug:        data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.thumbnail   !== undefined && { thumbnail:   data.thumbnail }),
      ...(data.audience    !== undefined && { audience:    data.audience }),
    },
  });
  revalidatePath('/admin/series');
  return { success: true, id };
}

export async function deleteSeriesAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.series.delete({ where: { id } });
  revalidatePath('/admin/series');
  return { success: true, id };
}

// Returns minimal list for article editor dropdown
export async function getSeriesListAction(): Promise<{ id: string; title: string; slug: string }[]> {
  await requireAdmin();
  return db.series.findMany({
    orderBy: { title: 'asc' },
    select: { id: true, title: true, slug: true },
  });
}

// Update article's series assignment
export async function assignArticleToSeriesAction(
  articleId: string,
  seriesId: string | null,
  seriesOrder: number | null,
): Promise<ActionResult> {
  await requireAdmin();
  await db.article.update({
    where: { id: articleId },
    data: { seriesId, seriesOrder },
  });
  revalidatePath('/admin/documents');
  return { success: true, id: articleId };
}
