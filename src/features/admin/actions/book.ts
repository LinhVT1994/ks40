'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ArticleAudience } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/slugify';

// ── Types ──────────────────────────────────────────────────────────

export type BookFormData = {
  title: string;
  slug: string;
  description?: string;
  cover?: string;
  audience: ArticleAudience;
  published: boolean;
};

export type ChapterFormData = {
  title: string;
  slug: string;
  content: string;
  order: number;
  isFree: boolean;
  readTime: number;
};

export type BookSummary = {
  id: string;
  title: string;
  slug: string;
  cover: string | null;
  audience: ArticleAudience;
  published: boolean;
  author: { name: string };
  _count: { chapters: number };
  createdAt: Date;
};

export type ChapterSummary = {
  id: string;
  title: string;
  slug: string;
  order: number;
  isFree: boolean;
};

type ActionResult = { success: true; id: string } | { success: false; error: string };

// ── Auth guard ─────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') throw new Error('Unauthorized');
  return session!.user!;
}

// ── Book CRUD ──────────────────────────────────────────────────────

export async function getAllBooksAction(): Promise<BookSummary[]> {
  await requireAdmin();
  return db.book.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      cover: true,
      audience: true,
      published: true,
      author: { select: { name: true } },
      _count: { select: { chapters: true } },
      createdAt: true,
    },
  });
}

export async function getBookAdminAction(id: string) {
  await requireAdmin();
  return db.book.findUnique({
    where: { id },
    include: {
      chapters: { orderBy: { order: 'asc' } },
      author: { select: { name: true } },
    },
  });
}

export async function createBookAction(data: BookFormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const slug = data.slug || slugify(data.title);

  const existing = await db.book.findUnique({ where: { slug } });
  if (existing) return { success: false, error: 'Slug đã tồn tại.' };

  const book = await db.book.create({
    data: {
      title:       data.title,
      slug,
      description: data.description,
      cover:       data.cover,
      audience:    data.audience,
      published:   data.published,
      authorId:    (user as { id: string }).id,
    },
  });
  revalidatePath('/admin/documents');
  return { success: true, id: book.id };
}

export async function updateBookAction(id: string, data: Partial<BookFormData>): Promise<ActionResult> {
  await requireAdmin();
  const book = await db.book.findUnique({ where: { id } });
  if (!book) return { success: false, error: 'Book không tồn tại.' };

  if (data.slug && data.slug !== book.slug) {
    const existing = await db.book.findUnique({ where: { slug: data.slug } });
    if (existing) return { success: false, error: 'Slug đã tồn tại.' };
  }

  await db.book.update({
    where: { id },
    data: {
      ...(data.title       !== undefined && { title:       data.title }),
      ...(data.slug        !== undefined && { slug:        data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.cover       !== undefined && { cover:       data.cover }),
      ...(data.audience    !== undefined && { audience:    data.audience }),
      ...(data.published   !== undefined && { published:   data.published }),
    },
  });
  revalidatePath('/admin/documents');
  revalidatePath(`/books/${data.slug ?? book.slug}`);
  return { success: true, id };
}

export async function deleteBookAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.book.delete({ where: { id } });
  revalidatePath('/admin/documents');
  return { success: true, id };
}

// ── Chapter CRUD ───────────────────────────────────────────────────

export async function getChaptersAction(bookId: string): Promise<ChapterSummary[]> {
  await requireAdmin();
  return db.chapter.findMany({
    where: { bookId },
    orderBy: { order: 'asc' },
    select: { id: true, title: true, slug: true, order: true, isFree: true },
  });
}

export async function getChapterAdminAction(id: string) {
  await requireAdmin();
  return db.chapter.findUnique({ where: { id } });
}

export async function createChapterAction(bookId: string, data: ChapterFormData): Promise<ActionResult> {
  await requireAdmin();
  const slug = data.slug || slugify(data.title);

  const existing = await db.chapter.findUnique({ where: { bookId_slug: { bookId, slug } } });
  if (existing) return { success: false, error: 'Slug chapter đã tồn tại trong book này.' };

  // Shift existing chapters if order conflicts
  await db.chapter.updateMany({
    where: { bookId, order: { gte: data.order } },
    data: { order: { increment: 1 } },
  });

  const chapter = await db.chapter.create({
    data: { bookId, title: data.title, slug, content: data.content, order: data.order, isFree: data.isFree, readTime: data.readTime },
  });

  const book = await db.book.findUnique({ where: { id: bookId }, select: { slug: true } });
  if (book) revalidatePath(`/books/${book.slug}`);
  return { success: true, id: chapter.id };
}

export async function updateChapterAction(id: string, data: Partial<ChapterFormData>): Promise<ActionResult> {
  await requireAdmin();
  const chapter = await db.chapter.findUnique({ where: { id } });
  if (!chapter) return { success: false, error: 'Chapter không tồn tại.' };

  if (data.slug && data.slug !== chapter.slug) {
    const existing = await db.chapter.findUnique({
      where: { bookId_slug: { bookId: chapter.bookId, slug: data.slug } },
    });
    if (existing) return { success: false, error: 'Slug chapter đã tồn tại trong book này.' };
  }

  await db.chapter.update({
    where: { id },
    data: {
      ...(data.title   !== undefined && { title:   data.title }),
      ...(data.slug    !== undefined && { slug:    data.slug }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.order   !== undefined && { order:   data.order }),
      ...(data.isFree    !== undefined && { isFree:    data.isFree }),
      ...(data.readTime  !== undefined && { readTime:  data.readTime }),
    },
  });

  const book = await db.book.findUnique({ where: { id: chapter.bookId }, select: { slug: true } });
  if (book) {
    revalidatePath(`/books/${book.slug}`);
    revalidatePath(`/books/${book.slug}/${data.slug ?? chapter.slug}`);
  }
  return { success: true, id };
}

export async function deleteChapterAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const chapter = await db.chapter.findUnique({ where: { id }, select: { bookId: true, order: true } });
  if (!chapter) return { success: false, error: 'Chapter không tồn tại.' };

  await db.chapter.delete({ where: { id } });

  // Re-compact orders after deletion
  const remaining = await db.chapter.findMany({
    where: { bookId: chapter.bookId },
    orderBy: { order: 'asc' },
    select: { id: true },
  });
  await Promise.all(
    remaining.map((c, i) => db.chapter.update({ where: { id: c.id }, data: { order: i + 1 } }))
  );

  revalidatePath('/admin/documents');
  return { success: true, id };
}

export async function reorderChaptersAction(
  bookId: string,
  orders: { id: string; order: number }[],
): Promise<ActionResult> {
  await requireAdmin();
  await Promise.all(
    orders.map(({ id, order }) => db.chapter.update({ where: { id }, data: { order } }))
  );
  const book = await db.book.findUnique({ where: { id: bookId }, select: { slug: true } });
  if (book) revalidatePath(`/books/${book.slug}`);
  return { success: true, id: bookId };
}
