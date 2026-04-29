'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/slugify';
import { ArticleStatus, NotificationType, Role } from '@prisma/client';
import { createNotificationAction } from '@/features/notifications/actions/notification';

export type GlossaryTermSummary = {
  id: string;
  term: string;
  slug: string;
  shortDef: string;
  topic?: { id: string; label: string; color: string } | null;
  author?: { id: string; name: string | null; image: string | null; username: string | null } | null;
};

export async function getGlossarySearchDataAction() {
  const terms = await db.glossaryTerm.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    select: {
      id: true,
      term: true,
      slug: true,
      shortDef: true,
    }
  });
  return terms;
}

export type GlossaryTermFormData = {
  term: string;
  shortDef: string;
  definition: string;
  topicId?: string | null;
  status?: ArticleStatus;
};

type ActionResult = { success: true; id: string } | { success: false; error: string };

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') throw new Error('Unauthorized');
}

export async function getGlossaryTermsAction(opts?: {
  search?: string;
  topicId?: string;
  letter?: string;
  status?: ArticleStatus;
  sort?: 'term' | 'date';
  page?: number;
  limit?: number;
  isAdmin?: boolean;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 30;
  const skip = (page - 1) * limit;

  const orderBy: any = opts?.sort === 'date'
    ? { createdAt: 'desc' }
    : { term: 'asc' };

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
        ? { not: { startsWith: 'A', mode: 'insensitive' as const } }
        : { startsWith: opts.letter, mode: 'insensitive' as const }
    }),
    ...(opts?.status && { status: opts.status }),
    ...(!opts?.isAdmin && !opts?.status && { status: ArticleStatus.PUBLISHED }),
  };

  const [terms, total, statusCountsRaw] = await Promise.all([
    db.glossaryTerm.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        topic: { select: { id: true, label: true, color: true } },
        author: { select: { id: true, name: true, image: true, username: true } },
      },
    }),
    db.glossaryTerm.count({ where }),
    db.glossaryTerm.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const statusCounts = statusCountsRaw.reduce((acc: Record<string, number>, curr: { status: ArticleStatus; _count: number }) => {
    acc[curr.status] = curr._count;
    return acc;
  }, {} as Record<string, number>);

  return { terms, total, totalPages: Math.ceil(total / limit), statusCounts };
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

  if (!term || term.status !== ArticleStatus.PUBLISHED) return null;

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
        status: data.status || ArticleStatus.PUBLISHED,
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
        status: data.status,
      },
    });
    // Notify author if published
    if (data.status === ArticleStatus.PUBLISHED) {
      const term = await db.glossaryTerm.findUnique({ where: { id }, select: { authorId: true, term: true, slug: true } });
      if (term?.authorId) {
        void createNotificationAction(
          term.authorId,
          NotificationType.GLOSSARY_APPROVED,
          `Thuật ngữ "${term.term}" đã được duyệt!`,
          { message: 'Cảm ơn đóng góp của bạn. Thuật ngữ hiện đã công khai trên hệ thống.', link: `/glossary/${term.slug}` }
        );
      }
    }

    revalidatePath('/admin/glossary');
    revalidatePath('/glossary');
    revalidatePath(`/glossary/${slug}`);
    return { success: true, id };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Lỗi không xác định' };
  }
}

export async function submitGlossaryTermAction(data: Omit<GlossaryTermFormData, 'definition' | 'status'>): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Vui lòng đăng nhập để đề xuất thuật ngữ');

    const slug = slugify(data.term);
    const existing = await db.glossaryTerm.findUnique({ where: { slug } });
    if (existing) return { success: false, error: 'Thuật ngữ này đã tồn tại trong hệ thống' };

    const term = await db.glossaryTerm.create({
      data: {
        slug,
        term: data.term.trim(),
        shortDef: data.shortDef.trim(),
        definition: '', // Initial empty definition for suggestions
        topicId: data.topicId || null,
        authorId: session.user.id,
        status: ArticleStatus.PENDING,
      },
    });
    revalidatePath('/admin/glossary');

    // Notify Admins
    const admins = await db.user.findMany({ where: { role: Role.ADMIN }, select: { id: true } });
    admins.forEach(admin => {
      void createNotificationAction(
        admin.id,
        NotificationType.GLOSSARY_SUBMITTED,
        'Có đề xuất thuật ngữ mới',
        { message: `Thành viên đã đề xuất thuật ngữ: "${data.term.trim()}"`, link: `/admin/glossary/${term.id}/edit` }
      );
    });

    return { success: true, id: term.id };
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

