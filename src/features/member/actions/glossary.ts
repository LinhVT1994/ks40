'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function toggleGlossaryLikeAction(termId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthorized');

  const existing = await db.glossaryLike.findUnique({
    where: { userId_termId: { userId, termId } },
  });

  if (existing) {
    await db.glossaryLike.delete({
      where: { userId_termId: { userId, termId } },
    });
  } else {
    await db.glossaryLike.create({
      data: { userId, termId },
    });
  }

  const count = await db.glossaryLike.count({ where: { termId } });
  
  // Revalidate the term page
  const term = await db.glossaryTerm.findUnique({ where: { id: termId } });
  if (term) {
    revalidatePath(`/glossary/${term.slug}`);
  }

  return { success: true, isLiked: !existing, count };
}

export async function toggleGlossaryBookmarkAction(termId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthorized');

  const existing = await db.glossaryBookmark.findUnique({
    where: { userId_termId: { userId, termId } },
  });

  if (existing) {
    await db.glossaryBookmark.delete({
      where: { userId_termId: { userId, termId } },
    });
  } else {
    await db.glossaryBookmark.create({
      data: { userId, termId },
    });
  }

  // Revalidate the term page
  const term = await db.glossaryTerm.findUnique({ where: { id: termId } });
  if (term) {
    revalidatePath(`/glossary/${term.slug}`);
  }

  return { success: true, isBookmarked: !existing };
}
