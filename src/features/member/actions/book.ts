'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ArticleAudience } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// ── Helpers ────────────────────────────────────────────────────────

function getAccessibleAudiences(role?: string): ArticleAudience[] {
  if (role === 'ADMIN')   return ['PUBLIC', 'MEMBERS', 'PREMIUM'];
  if (role === 'PREMIUM') return ['PUBLIC', 'MEMBERS', 'PREMIUM'];
  if (role === 'MEMBER')  return ['PUBLIC', 'MEMBERS'];
  return ['PUBLIC'];
}

// ── Book list ──────────────────────────────────────────────────────

export async function getBooksAction() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const audiences = getAccessibleAudiences(role);

  return db.book.findMany({
    where: { published: true, audience: { in: audiences } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      cover: true,
      description: true,
      audience: true,
      author: { select: { name: true, image: true } },
      _count: { select: { chapters: true } },
      createdAt: true,
    },
  });
}

// ── Book landing page ──────────────────────────────────────────────

export async function getBookBySlugAction(slug: string) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const userId = session?.user?.id;
  const audiences = getAccessibleAudiences(role);

  const book = await db.book.findUnique({
    where: { slug, published: true },
    include: {
      author: { select: { id: true, name: true, image: true, bio: true } },
      chapters: {
        orderBy: { order: 'asc' },
        select: { id: true, title: true, slug: true, order: true, isFree: true, readTime: true },
      },
    },
  });

  if (!book) return null;

  // Check audience access
  const canAccess = audiences.includes(book.audience);

  // Get user's read history for this book
  let readChapterIds: string[] = [];
  if (userId) {
    const histories = await db.bookReadHistory.findMany({
      where: { userId, bookId: book.id },
      select: { chapterId: true },
    });
    readChapterIds = histories.map(h => h.chapterId);
  }

  // Find last read chapter for "continue reading"
  let lastReadChapter: { slug: string; title: string } | null = null;
  if (readChapterIds.length > 0) {
    const lastRead = await db.chapter.findFirst({
      where: { bookId: book.id, id: { in: readChapterIds } },
      orderBy: { order: 'desc' },
      select: { slug: true, title: true },
    });
    lastReadChapter = lastRead;
  }

  return {
    ...book,
    canAccess,
    readChapterIds,
    lastReadChapter,
    readCount: readChapterIds.length,
    totalChapters: book.chapters.length,
  };
}

// ── Chapter reader ─────────────────────────────────────────────────

export async function getChapterAction(bookSlug: string, chapterSlug: string) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const userId = session?.user?.id;
  const audiences = getAccessibleAudiences(role);

  const book = await db.book.findUnique({
    where: { slug: bookSlug, published: true },
    include: {
      chapters: {
        orderBy: { order: 'asc' },
        select: { id: true, title: true, slug: true, order: true, isFree: true },
      },
    },
  });

  if (!book) return null;

  const chapter = book.chapters.find(c => c.slug === chapterSlug);
  if (!chapter) return null;

  // Access check: free chapters open to all, others check audience
  const hasAccess = chapter.isFree || audiences.includes(book.audience);

  // Fetch full content only if access granted
  const fullChapter = hasAccess
    ? await db.chapter.findUnique({ where: { id: chapter.id } })
    : null;

  // Prev / next within book
  const currentIdx = book.chapters.findIndex(c => c.slug === chapterSlug);
  const prev = currentIdx > 0 ? book.chapters[currentIdx - 1] : null;
  const next = currentIdx < book.chapters.length - 1 ? book.chapters[currentIdx + 1] : null;

  // Read history for sidebar checkmarks
  let readChapterIds: string[] = [];
  if (userId) {
    const histories = await db.bookReadHistory.findMany({
      where: { userId, bookId: book.id },
      select: { chapterId: true },
    });
    readChapterIds = histories.map(h => h.chapterId);
  }

  return {
    book: {
      id: book.id,
      title: book.title,
      slug: book.slug,
      audience: book.audience,
    },
    chapter: fullChapter ?? { ...chapter, content: '' },
    chapters: book.chapters,
    prev,
    next,
    hasAccess,
    readChapterIds,
  };
}

// ── Reading progress ───────────────────────────────────────────────

export async function saveChapterProgressAction(chapterId: string): Promise<{ success: boolean }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false };

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    select: { bookId: true },
  });
  if (!chapter) return { success: false };

  await db.bookReadHistory.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: { userId, chapterId, bookId: chapter.bookId, readAt: new Date() },
    update: { readAt: new Date() },
  });

  return { success: true };
}

export async function getBookProgressAction(bookId: string): Promise<{ readCount: number; totalChapters: number; percent: number }> {
  const session = await auth();
  const userId = session?.user?.id;

  const totalChapters = await db.chapter.count({ where: { bookId } });
  if (!userId || totalChapters === 0) return { readCount: 0, totalChapters, percent: 0 };

  const readCount = await db.bookReadHistory.count({ where: { userId, bookId } });
  const percent = Math.round((readCount / totalChapters) * 100);

  return { readCount, totalChapters, percent };
}
