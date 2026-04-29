'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/slugify';

export type GlossaryTermFormData = {
  term: string;
  shortDef: string;
  definition: string;
  topicId?: string | null;
};

type ActionResult = { success: true; id: string } | { success: false; error: string };

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') throw new Error('Unauthorized');
}

export async function getGlossaryTermsAction(opts?: { search?: string; topicId?: string; letter?: string; page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 30;
  const skip = (page - 1) * limit;

  const where = {
    ...(opts?.search && {
      OR: [
        { term: { contains: opts.search, mode: 'insensitive' as const } },
        { shortDef: { contains: opts.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(opts?.topicId && { topicId: opts.topicId }),
    ...(opts?.letter && {
      term: opts.letter === '#' 
        ? { not: { startsWith: 'A', mode: 'insensitive' as const } } // Simplified for non-alpha
        : { startsWith: opts.letter, mode: 'insensitive' as const }
    }),
  };

  const [terms, total] = await Promise.all([
    db.glossaryTerm.findMany({
      where,
      orderBy: { term: 'asc' },
      skip,
      take: limit,
      include: { topic: { select: { id: true, label: true, color: true } } },
    }),
    db.glossaryTerm.count({ where }),
  ]);

  return { terms, total, totalPages: Math.ceil(total / limit) };
}

export async function getGlossaryTermBySlugAction(slug: string) {
  const session = await auth();
  const userId = session?.user?.id;

  const term = await db.glossaryTerm.findUnique({
    where: { slug },
    include: { 
      topic: { select: { id: true, label: true, color: true, emoji: true } },
      author: { 
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
          bio: true,
          _count: {
            select: {
              followers: true,
              articles: true,
            }
          },
          followers: userId ? {
            where: { followerId: userId }
          } : false
        }
      },
      _count: {
        select: {
          likes: true,
        }
      },
      likes: userId ? {
        where: { userId }
      } : false,
      bookmarks: userId ? {
        where: { userId }
      } : false,
    },
  });

  if (!term) return null;

  // Transform to match AuthorInfo type
  const formattedAuthor = term.author ? {
    ...term.author,
    followerCount: term.author._count.followers,
    articleCount: term.author._count.articles,
    isFollowing: term.author.followers?.length > 0,
  } : null;

  return { 
    ...term, 
    author: formattedAuthor,
    likeCount: term._count.likes,
    isLiked: term.likes?.length > 0,
    isBookmarked: term.bookmarks?.length > 0,
  };
}

export async function getGlossaryTermByIdAction(id: string) {
  return db.glossaryTerm.findUnique({
    where: { id },
    include: { topic: { select: { id: true, label: true } } },
  });
}

export async function createGlossaryTermAction(data: GlossaryTermFormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const slug = slugify(data.term);
    const existing = await db.glossaryTerm.findUnique({ where: { slug } });
    if (existing) return { success: false, error: 'Slug đã tồn tại cho thuật ngữ này' };

    const session = await auth();
    const userId = session?.user?.id;

    const term = await db.glossaryTerm.create({
      data: {
        slug,
        term: data.term.trim(),
        shortDef: data.shortDef.trim(),
        definition: data.definition.trim(),
        topicId: data.topicId || null,
        authorId: userId,
      },
    });
    revalidatePath('/admin/glossary');
    revalidatePath('/glossary');
    return { success: true, id: term.id };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Lỗi không xác định' };
  }
}

export async function updateGlossaryTermAction(id: string, data: GlossaryTermFormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const slug = slugify(data.term);
    const conflict = await db.glossaryTerm.findFirst({ where: { slug, NOT: { id } } });
    if (conflict) return { success: false, error: 'Slug đã tồn tại cho thuật ngữ khác' };

    await db.glossaryTerm.update({
      where: { id },
      data: {
        slug,
        term: data.term.trim(),
        shortDef: data.shortDef.trim(),
        definition: data.definition.trim(),
        topicId: data.topicId || null,
      },
    });
    revalidatePath('/admin/glossary');
    revalidatePath('/glossary');
    return { success: true, id };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Lỗi không xác định' };
  }
}

export async function deleteGlossaryTermAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.glossaryTerm.delete({ where: { id } });
    revalidatePath('/admin/glossary');
    revalidatePath('/glossary');
    return { success: true, id };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Lỗi không xác định' };
  }
}

