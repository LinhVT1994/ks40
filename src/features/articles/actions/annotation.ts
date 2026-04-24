'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidateTag } from 'next/cache';

export interface ArticleAnnotation {
  id: string;
  articleId: string;
  selectedText: string;
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  color: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  article?: {
    title: string;
  };
}

export async function getArticleAnnotationsAction(articleId: string): Promise<ArticleAnnotation[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  return db.articleAnnotation.findMany({
    where: { userId, articleId },
    orderBy: { createdAt: 'desc' },
    include: {
      article: {
        select: { title: true }
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
        select: { title: true }
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
}): Promise<ArticleAnnotation> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthenticated');

  const annotation = await db.articleAnnotation.create({
    data: { userId, ...data },
  });

  revalidateTag(`article-annotations:${data.articleId}:${userId}`, 'default');
  return annotation;
}

export async function updateAnnotationAction(
  id: string,
  data: { note?: string; color?: string },
): Promise<ArticleAnnotation> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthenticated');

  const annotation = await db.articleAnnotation.update({
    where: { id, userId },
    data,
  });

  revalidateTag(`article-annotations:${annotation.articleId}:${userId}`, 'default');
  return annotation;
}

export async function deleteAnnotationAction(id: string): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthenticated');

  const annotation = await db.articleAnnotation.findUnique({
    where: { id, userId },
    select: { articleId: true },
  });
  if (!annotation) return;

  await db.articleAnnotation.delete({ where: { id, userId } });
  revalidateTag(`article-annotations:${annotation.articleId}:${userId}`, 'default');
}
