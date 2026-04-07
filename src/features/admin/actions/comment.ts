'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { CommentStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await auth();
  const role    = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') throw new Error('Unauthorized');
}

export type AdminComment = {
  id: string;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  author: { id: string; name: string; email: string; image: string | null };
  article: { id: string; title: string; slug: string };
  _count: { replies: number };
};

export async function getAdminCommentsAction(options: {
  search?: string;
  status?: CommentStatus;
  sort?: 'newest' | 'oldest';
  page?: number;
  limit?: number;
} = {}) {
  await requireAdmin();

  const { search, status, sort = 'newest', page = 1, limit = 10 } = options;

  const where = {
    ...(status && { status }),
    parentId: null, // top-level only
    ...(search && {
      OR: [
        { content:          { contains: search, mode: 'insensitive' as const } },
        { author: { name:  { contains: search, mode: 'insensitive' as const } } },
        { author: { email: { contains: search, mode: 'insensitive' as const } } },
      ],
    }),
  };

  const searchWhere = {
    parentId: null as null,
    ...(search && {
      OR: [
        { content:          { contains: search, mode: 'insensitive' as const } },
        { author: { name:  { contains: search, mode: 'insensitive' as const } } },
        { author: { email: { contains: search, mode: 'insensitive' as const } } },
      ],
    }),
  };

  const [comments, total, visibleCount, hiddenCount, spamCount, allCount] = await Promise.all([
    db.comment.findMany({
      where,
      orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        author:  { select: { id: true, name: true, email: true, image: true } },
        article: { select: { id: true, title: true, slug: true } },
        _count:  { select: { replies: true } },
      },
    }),
    db.comment.count({ where }),
    db.comment.count({ where: { ...searchWhere, status: CommentStatus.VISIBLE } }),
    db.comment.count({ where: { ...searchWhere, status: CommentStatus.HIDDEN  } }),
    db.comment.count({ where: { ...searchWhere, status: CommentStatus.SPAM    } }),
    db.comment.count({ where: searchWhere }),
  ]);

  return {
    comments: comments as AdminComment[],
    total,
    totalPages: Math.ceil(total / limit),
    page,
    counts: { all: allCount, visible: visibleCount, hidden: hiddenCount, spam: spamCount },
  };
}

export async function updateCommentStatusAction(id: string, status: CommentStatus) {
  await requireAdmin();
  await db.comment.update({ where: { id }, data: { status } });
  revalidatePath('/admin/comments');
}

export async function deleteAdminCommentAction(id: string) {
  await requireAdmin();
  await db.comment.delete({ where: { id } });
  revalidatePath('/admin/comments');
}

export async function replyAdminCommentAction(commentId: string, content: string) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') throw new Error('Unauthorized');
  if (!user.id) throw new Error('No user id');

  // Lấy articleId từ comment cha
  const parent = await db.comment.findUnique({
    where: { id: commentId },
    select: { articleId: true },
  });
  if (!parent) throw new Error('Comment not found');

  await db.comment.create({
    data: {
      content: content.trim(),
      articleId: parent.articleId,
      authorId:  user.id,
      parentId:  commentId,
      status:    'VISIBLE',
    },
  });

  revalidatePath('/admin/comments');
}
