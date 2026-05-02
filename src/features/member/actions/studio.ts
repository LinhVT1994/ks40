'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function getMemberArticlesAction() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  return await db.article.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      summary: true,
      content: true,
      author: {
        select: {
          name: true,
          image: true,
        }
      },
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getSlideshowTemplatesAction() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  return await db.slideshowTemplate.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function saveSlideshowTemplateAction(data: {
  name: string;
  layout: string;
  fontFamily: string;
  accentColor: string;
  overlayOpacity: number;
  blocks?: any;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthorized');

  return await db.slideshowTemplate.create({
    data: {
      ...data,
      userId,
    },
  });
}

export async function deleteSlideshowTemplateAction(templateId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthorized');

  return await db.slideshowTemplate.delete({
    where: { id: templateId, userId },
  });
}
