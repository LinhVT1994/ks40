'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ArticleAudience, ArticleBadge, ArticleStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { eventBus, EVENTS } from '@/lib/events/bus';

export type ResourceDraft = {
  name: string;
  url: string;
  size: number;
  mimeType: string;
};

export type ArticleFormData = {
  title: string;
  slug: string;
  summary?: string;
  overview?: string;
  content: string;
  cover?: string;
  coverPosition?: string;
  thumbnail?: string;
  thumbnailPosition?: string;
  objectives?: string;
  topicId: string;
  badges: ArticleBadge[];
  audience: ArticleAudience;
  status: ArticleStatus;
  readTime?: number;
  tags?: string[];         // tag names
  publishedAt?: string;    // ISO string nếu scheduled
  resources?: ResourceDraft[];
  seriesId?: string | null;
  seriesOrder?: number | null;
  nextArticleId?: string | null;
};

type ActionResult = { success: true; id: string } | { success: false; error: string };

async function requireAdmin() {
  const session = await auth();
  const role    = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') throw new Error('Unauthorized');
  return session!.user!;
}

// Upsert tags và trả về id list
async function upsertTags(tagNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const tag  = await db.tag.upsert({
      where:  { slug },
      update: {},
      create: { name: name.trim(), slug },
    });
    ids.push(tag.id);
  }
  return ids;
}

export async function getTagsAction(): Promise<string[]> {
  const tags = await db.tag.findMany({ orderBy: { name: 'asc' }, select: { name: true } });
  return tags.map(t => t.name);
}

export async function createArticleAction(data: ArticleFormData): Promise<ActionResult> {
  const user = await requireAdmin();

  const existing = await db.article.findUnique({ where: { slug: data.slug } });
  if (existing) return { success: false, error: 'Slug đã tồn tại.' };

  const tagIds = await upsertTags(data.tags ?? []);

  const article = await db.article.create({
    data: {
      title:       data.title,
      slug:        data.slug,
      summary:    data.summary,
      overview:   data.overview,
      objectives: data.objectives,
      content:    data.content,
      cover:             data.cover,
      coverPosition:     data.coverPosition,
      thumbnail:         data.thumbnail,
      thumbnailPosition: data.thumbnailPosition,
      topicId:     data.topicId,
      badges:      data.badges,
      audience:    data.audience,
      status:      data.status,
      readTime:    data.readTime ?? 5,
      publishedAt: data.status === 'PUBLISHED' ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null,
      authorId:    user.id!,
      ...(data.seriesId !== undefined && { seriesId: data.seriesId }),
      ...(data.seriesOrder !== undefined && { seriesOrder: data.seriesOrder }),
      ...(data.nextArticleId !== undefined && { nextArticleId: data.nextArticleId }),
      tags: { create: tagIds.map(tagId => ({ tagId })) },
      ...(data.resources?.length && {
        resources: {
          create: data.resources.map(r => ({
            name:     r.name,
            url:      r.url,
            size:     r.size,
            mimeType: r.mimeType,
          })),
        },
      }),
    },
  });

  if (article.status === 'PUBLISHED') {
    eventBus.emit(EVENTS.ARTICLE_PUBLISHED, {
      articleId: article.id,
      slug: article.slug,
      title: article.title,
      actorId: user.id,
      authorName: user.name ?? 'Admin',
    });
  }

  revalidatePath('/admin/documents');
  revalidatePath('/');
  return { success: true, id: article.id };
}

export async function updateArticleAction(id: string, data: Partial<ArticleFormData>): Promise<ActionResult> {
  const user = await requireAdmin();

  const article = await db.article.findUnique({ where: { id } });
  if (!article) return { success: false, error: 'Bài viết không tồn tại.' };

  // Cập nhật tags nếu có
  if (data.tags !== undefined) {
    const tagIds = await upsertTags(data.tags);
    await db.articleTag.deleteMany({ where: { articleId: id } });
    await db.articleTag.createMany({
      data: tagIds.map(tagId => ({ articleId: id, tagId })),
    });
  }

  const updated = await db.article.update({
    where: { id },
    data: {
      ...(data.title       && { title:     data.title }),
      ...(data.slug        && { slug:      data.slug }),
      ...(data.summary     !== undefined && { summary:     data.summary }),
      ...(data.overview    !== undefined && { overview:    data.overview }),
      ...(data.objectives  !== undefined && { objectives:  data.objectives }),
      ...(data.content     && { content:   data.content }),
      ...(data.cover             !== undefined && { cover:             data.cover }),
      ...(data.coverPosition     !== undefined && { coverPosition:     data.coverPosition }),
      ...(data.thumbnail         !== undefined && { thumbnail:         data.thumbnail }),
      ...(data.thumbnailPosition !== undefined && { thumbnailPosition: data.thumbnailPosition }),
      ...(data.topicId     && { topicId:   data.topicId }),
      ...(data.badges      && { badges:    data.badges }),
      ...(data.audience    && { audience:  data.audience }),
      ...(data.readTime    && { readTime:  data.readTime }),
      ...(data.seriesId       !== undefined && { seriesId:       data.seriesId }),
      ...(data.seriesOrder    !== undefined && { seriesOrder:    data.seriesOrder }),
      ...(data.nextArticleId  !== undefined && { nextArticleId:  data.nextArticleId }),
      ...(data.status      && {
        status:      data.status,
        publishedAt: data.status === 'PUBLISHED' && !article.publishedAt ? new Date() : undefined,
      }),
    },
  });

  if (article.status !== 'PUBLISHED' && updated.status === 'PUBLISHED') {
    eventBus.emit(EVENTS.ARTICLE_PUBLISHED, {
      articleId: updated.id,
      slug: updated.slug,
      title: updated.title,
      actorId: user.id,
      authorName: user.name ?? 'Admin',
    });
  }

  revalidatePath('/admin/documents');
  revalidatePath(`/article/${data.slug ?? article.slug}`);
  return { success: true, id };
}

export async function quickUpdateArticleAction(
  id: string,
  patch: { status?: ArticleStatus; audience?: ArticleAudience; badges?: ArticleBadge[] },
): Promise<ActionResult> {
  await requireAdmin();
  const article = await db.article.findUnique({ where: { id } });
  if (!article) return { success: false, error: 'Bài viết không tồn tại.' };

  const { badges, ...rest } = patch;
  const updated = await db.article.update({
    where: { id },
    data: {
      ...rest,
      ...(badges !== undefined && { badges: { set: badges } }),
    },
  });

  if (patch.status === 'PUBLISHED' && article.status !== 'PUBLISHED') {
    eventBus.emit(EVENTS.ARTICLE_PUBLISHED, {
      articleId: updated.id, slug: updated.slug, title: updated.title,
      actorId: 'admin', authorName: 'Admin',
    });
  }

  revalidatePath('/admin/documents');
  revalidatePath(`/article/${article.slug}`);
  return { success: true, id };
}

export async function addResourceAction(articleId: string, resource: ResourceDraft): Promise<ActionResult> {
  await requireAdmin();
  const r = await db.resource.create({
    data: { articleId, ...resource },
  });
  revalidatePath(`/admin/articles/${articleId}/edit`);
  return { success: true, id: r.id };
}

export async function deleteResourceAction(resourceId: string): Promise<ActionResult> {
  await requireAdmin();
  const r = await db.resource.findUnique({ where: { id: resourceId } });
  if (!r) return { success: false, error: 'Không tìm thấy tài nguyên.' };
  await db.resource.delete({ where: { id: resourceId } });
  revalidatePath(`/admin/articles/${r.articleId}/edit`);
  return { success: true, id: resourceId };
}

export async function deleteArticleAction(id: string): Promise<ActionResult> {
  await requireAdmin();

  const article = await db.article.findUnique({ where: { id } });
  if (!article) return { success: false, error: 'Bài viết không tồn tại.' };

  await db.article.delete({ where: { id } });

  revalidatePath('/admin/documents');
  revalidatePath('/');
  return { success: true, id };
}

export async function getAdminArticlesAction(options: {
  search?: string;
  topicId?: string;
  status?: ArticleStatus;
  source?: 'admin' | 'member';
  page?: number;
  limit?: number;
} = {}) {
  await requireAdmin();

  const { search, topicId, status, source, page = 1, limit = 20 } = options;

  const where = {
    ...(topicId  && { topicId }),
    ...(status   && { status }),
    ...(source === 'admin'  && { author: { is: { role: 'ADMIN' as const } } }),
    ...(source === 'member' && { author: { is: { role: { not: 'ADMIN' as const } } } }),
    ...(search   && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        author: { select: { name: true, role: true } },
        tags:   { include: { tag: { select: { name: true } } } },
        _count: { select: { likes: true, comments: true, bookmarks: true } },
        topic:  { select: { id: true, slug: true, label: true, emoji: true, color: true } },
      },
    }),
    db.article.count({ where }),
  ]);

  return { articles, total, totalPages: Math.ceil(total / limit), page };
}

export async function getPendingArticlesCountAction(): Promise<number> {
  await requireAdmin();
  return db.article.count({ where: { status: 'PENDING' } });
}

// Minimal list for article pickers (next-article selector, series, etc.)
export async function getArticlePickerListAction(excludeId?: string): Promise<{ id: string; title: string; slug: string; thumbnail: string | null }[]> {
  await requireAdmin();
  const rows = await db.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      ...(excludeId && { id: { not: excludeId } }),
    },
    orderBy: { publishedAt: 'desc' },
    take: 200,
    select: { id: true, title: true, slug: true, thumbnail: true },
  });
  return rows;
}

