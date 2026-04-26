'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidateTag } from 'next/cache';

export interface ArticleAnnotation {
  id: string;
  userId?: string;
  articleId: string;
  selectedText: string;
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  color: string;
  note: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  article?: {
    title: string;
    slug: string;
  };
}

export async function getArticleAnnotationsAction(articleId: string): Promise<ArticleAnnotation[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  return db.articleAnnotation.findMany({
    where: { userId, articleId, isPublic: false },
    orderBy: { createdAt: 'desc' },
    include: {
      article: {
        select: { title: true, slug: true }
      }
    }
  });
}

export async function getArticleAuthorAnnotationsAction(articleId: string): Promise<ArticleAnnotation[]> {
  const article = await db.article.findUnique({
    where: { id: articleId },
    select: { authorId: true },
  });
  if (!article) return [];

  return db.articleAnnotation.findMany({
    where: { articleId, userId: article.authorId, isPublic: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getAnnotationAction(id: string): Promise<ArticleAnnotation | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  return db.articleAnnotation.findUnique({
    where: { id, userId },
    include: {
      article: {
        select: { title: true, slug: true }
      }
    }
  });
}

export async function getAllUserAnnotationsAction(): Promise<ArticleAnnotation[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  return db.articleAnnotation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      article: {
        select: { title: true, slug: true }
      }
    }
  });
}

export async function createAnnotationAction(data: {
  articleId: string;
  selectedText: string;
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  color: string;
  note?: string;
  isPublic?: boolean;
}): Promise<ArticleAnnotation> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthenticated');

  // Only the article author can create public annotations
  let isPublic = false;
  if (data.isPublic) {
    const article = await db.article.findUnique({
      where: { id: data.articleId },
      select: { authorId: true },
    });
    isPublic = article?.authorId === userId;
  }

  const { isPublic: _isPublicInput, ...rest } = data;
  const annotation = await db.articleAnnotation.create({
    data: { userId, ...rest, isPublic },
  });

  revalidateTag(`article-annotations:${data.articleId}:${userId}`, 'default');
  if (isPublic) revalidateTag(`article-author-annotations:${data.articleId}`, 'default');
  return annotation;
}

export async function updateAnnotationAction(
  id: string,
  data: { note?: string; color?: string; isPublic?: boolean },
): Promise<ArticleAnnotation> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthenticated');

  const annotation = await db.articleAnnotation.update({
    where: { id, userId },
    data,
  });

  revalidateTag(`article-annotations:${annotation.articleId}:${userId}`, 'default');
  if (annotation.isPublic) revalidateTag(`article-author-annotations:${annotation.articleId}`, 'default');
  return annotation;
}

export async function deleteAnnotationAction(id: string): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthenticated');

  const annotation = await db.articleAnnotation.findUnique({
    where: { id, userId },
    select: { articleId: true, isPublic: true },
  });
  if (!annotation) return;

  await db.articleAnnotation.delete({ where: { id, userId } });
  revalidateTag(`article-annotations:${annotation.articleId}:${userId}`, 'default');
  if (annotation.isPublic) revalidateTag(`article-author-annotations:${annotation.articleId}`, 'default');
}
