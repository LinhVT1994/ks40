'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { CommentStatus } from '@prisma/client';
import { eventBus, EVENTS } from '@/lib/events/bus';
import { createNotificationAction } from '@/features/notifications/actions/notification';

const MAX_COMMENT_IMAGES = 4;

export type CommentWithAuthor = {
  id: string;
  content: string;
  images: string[];
  createdAt: Date;
  parentId: string | null;
  author: { id: string; name: string; image: string | null; username: string | null };
  replies: CommentWithAuthor[];
  replyCount: number;
  repliesLoaded: boolean;
  likeCount: number;
  dislikeCount: number;
  isLiked: boolean;
  isDisliked: boolean;
};

export async function getCommentsAction(articleId: string): Promise<CommentWithAuthor[]> {
  const session = await auth();
  const userId  = session?.user?.id;

  const comments = await db.comment.findMany({
    where:   { articleId, status: CommentStatus.VISIBLE, parentId: null },
    orderBy: { createdAt: 'desc' },
    include: {
      author:  { select: { id: true, name: true, image: true, username: true } },
      likes:   { select: { userId: true, type: true } },
      _count:  { select: { replies: { where: { status: CommentStatus.VISIBLE } } } },
    },
  });

  const mapComment = (c: any): CommentWithAuthor => {
    const likes: { userId: string; type: 'LIKE' | 'DISLIKE' }[] = c.likes ?? [];
    return {
      id:            c.id,
      content:       c.content,
      images:        c.images ?? [],
      createdAt:     c.createdAt,
      parentId:      c.parentId,
      author:        c.author,
      replies:       [],
      replyCount:    c._count?.replies ?? 0,
      repliesLoaded: false,
      likeCount:     likes.filter(l => l.type === 'LIKE').length,
      dislikeCount:  likes.filter(l => l.type === 'DISLIKE').length,
      isLiked:       !!userId && likes.some(l => l.userId === userId && l.type === 'LIKE'),
      isDisliked:    !!userId && likes.some(l => l.userId === userId && l.type === 'DISLIKE'),
    };
  };

  return comments.map(mapComment);
}

export async function getRepliesAction(commentId: string): Promise<CommentWithAuthor[]> {
  const session = await auth();
  const userId  = session?.user?.id;

  const replies = await db.comment.findMany({
    where:   { parentId: commentId, status: CommentStatus.VISIBLE },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, image: true, username: true } },
      likes:  { select: { userId: true, type: true } },
    },
  });

  return replies.map((r: any) => {
    const likes: { userId: string; type: 'LIKE' | 'DISLIKE' }[] = r.likes ?? [];
    return {
      id:            r.id,
      content:       r.content,
      images:        r.images ?? [],
      createdAt:     r.createdAt,
      parentId:      r.parentId,
      author:        r.author,
      replies:       [],
      replyCount:    0,
      repliesLoaded: true,
      likeCount:     likes.filter(l => l.type === 'LIKE').length,
      dislikeCount:  likes.filter(l => l.type === 'DISLIKE').length,
      isLiked:       !!userId && likes.some(l => l.userId === userId && l.type === 'LIKE'),
      isDisliked:    !!userId && likes.some(l => l.userId === userId && l.type === 'DISLIKE'),
    };
  });
}

export async function createCommentAction(
  articleId: string,
  content: string,
  parentId?: string,
  images: string[] = [],
): Promise<{ success: boolean; error?: string; comment?: CommentWithAuthor }> {
  if (typeof articleId !== 'string' || !/^[a-z0-9]{10,32}$/i.test(articleId)) {
    return { success: false, error: 'Bài viết không hợp lệ.' };
  }
  if (parentId !== undefined && (typeof parentId !== 'string' || !/^[a-z0-9]{10,32}$/i.test(parentId))) {
    return { success: false, error: 'Bình luận gốc không hợp lệ.' };
  }
  if (typeof content !== 'string') {
    return { success: false, error: 'Nội dung không hợp lệ.' };
  }

  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return { success: false, error: 'Bạn cần đăng nhập để bình luận.' };

  const trimmed = content.trim();
  if (trimmed.length > 1000) return { success: false, error: 'Bình luận tối đa 1000 ký tự.' };

  // Validate images: chặn URL bên ngoài, chỉ cho phép file đã upload qua endpoint comment-image (local hoặc azure)
  const cleanImages = (Array.isArray(images) ? images : [])
    .filter(u => 
      typeof u === 'string' && (
        u.startsWith('/uploads/comments/') || 
        (u.includes('.blob.core.windows.net/') && u.includes('/comments/'))
      )
    )
    .slice(0, MAX_COMMENT_IMAGES);

  if (!trimmed && cleanImages.length === 0) {
    return { success: false, error: 'Bình luận phải có nội dung hoặc ít nhất 1 ảnh.' };
  }

  const comment = await db.comment.create({
    data: {
      content:  trimmed,
      images:   cleanImages,
      articleId,
      authorId: userId,
      parentId: parentId ?? null,
    },
    include: { author: { select: { id: true, name: true, image: true, username: true } } },
  });

  // Lấy thông tin bài viết để gửi notification
  const article = await db.article.findUnique({
    where: { id: articleId },
    select: { title: true, slug: true, authorId: true },
  });

  if (article) {
    const commenterName = (session.user as { name?: string }).name ?? 'Ai đó';

    // Emit event để ghi Activity Log
    eventBus.emit(EVENTS.COMMENT_POSTED, {
      commentId:    comment.id,
      articleTitle: article.title,
      articleSlug:  article.slug,
      authorName:   commenterName,
      actorId:      userId,
    });

    // Notify tác giả bài viết (nếu không phải chính mình comment) — fire-and-forget
    if (article.authorId !== userId) {
      void createNotificationAction(
        article.authorId,
        'COMMENT_REPLY',
        `${commenterName} đã bình luận bài viết của bạn`,
        {
          message: trimmed
            ? `"${trimmed.slice(0, 80)}${trimmed.length > 80 ? '...' : ''}"`
            : `[đã gửi ${cleanImages.length} ảnh]`,
          link:    `/article/${article.slug}`,
        },
      );
    }

    // Notify người bị reply (nếu là comment con và khác commenter)
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      if (parentComment && parentComment.authorId !== userId && parentComment.authorId !== article.authorId) {
        void createNotificationAction(
          parentComment.authorId,
          'COMMENT_REPLY',
          `${commenterName} đã trả lời bình luận của bạn`,
          {
            message: trimmed
            ? `"${trimmed.slice(0, 80)}${trimmed.length > 80 ? '...' : ''}"`
            : `[đã gửi ${cleanImages.length} ảnh]`,
            link:    `/article/${article.slug}`,
          },
        );
      }
    }
  }

  return {
    success: true,
    comment: {
      ...comment,
      images:        cleanImages,
      replies:       [],
      replyCount:    0,
      repliesLoaded: true,
      likeCount:     0,
      dislikeCount:  0,
      isLiked:       false,
      isDisliked:    false,
    } as unknown as CommentWithAuthor,
  };
}

export async function toggleCommentLikeAction(
  commentId: string,
  type: 'LIKE' | 'DISLIKE',
): Promise<{ success: boolean; likeCount: number; dislikeCount: number; isLiked: boolean; isDisliked: boolean }> {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return { success: false, likeCount: 0, dislikeCount: 0, isLiked: false, isDisliked: false };

  const existing = await db.commentLike.findUnique({ where: { commentId_userId: { commentId, userId } } });

  if (existing) {
    if (existing.type === type) {
      // Toggle off
      await db.commentLike.delete({ where: { commentId_userId: { commentId, userId } } });
    } else {
      // Switch type
      await db.commentLike.update({ where: { commentId_userId: { commentId, userId } }, data: { type } });
    }
  } else {
    await db.commentLike.create({ data: { commentId, userId, type } });
  }

  const [likeCount, dislikeCount] = await Promise.all([
    db.commentLike.count({ where: { commentId, type: 'LIKE' } }),
    db.commentLike.count({ where: { commentId, type: 'DISLIKE' } }),
  ]);

  const updated = await db.commentLike.findUnique({ where: { commentId_userId: { commentId, userId } } });
  return {
    success:     true,
    likeCount,
    dislikeCount,
    isLiked:     updated?.type === 'LIKE',
    isDisliked:  updated?.type === 'DISLIKE',
  };
}

export async function deleteCommentAction(commentId: string): Promise<{ success: boolean }> {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return { success: false };

  const comment = await db.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { success: false };

  const role    = (session?.user as { role?: string })?.role;
  const isOwner = comment.authorId === userId;
  const isAdmin = role === 'ADMIN';

  if (!isOwner && !isAdmin) return { success: false };

  await db.comment.delete({ where: { id: commentId } });
  return { success: true };
}
