'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { ArticleStatus, ArticleAudience, ArticleBadge, NotificationType } from '@prisma/client';
import { createNotificationAction } from '@/features/notifications/actions/notification';
import { eventBus, EVENTS } from '@/lib/events/bus';

type ActionResult = { success: true; id: string } | { success: false; error: string };

export type MemberArticleFormData = {
  title: string;
  slug: string;
  summary?: string;
  overview?: string;
  objectives?: string;
  content: string;
  cover?: string;
  coverPosition?: string;
  thumbnail?: string;
  thumbnailPosition?: string;
  topicId: string;
  tags?: string[];
  readTime?: number;
};

async function requireWriter() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthorized');
  const user = await db.user.findUnique({ 
    where: { id: userId }, 
    select: { id: true, name: true, role: true, canWrite: true, username: true } 
  });
  
  if (!user) throw new Error('Unauthorized');
  
  // Use a type-safe check for canWrite - cast to any since we know the schema but TS might be stale
  const castUser = user as any;
  const isAuthorized = user.role === 'ADMIN' || castUser.canWrite;
  if (!isAuthorized) throw new Error('Bạn chưa được cấp quyền viết bài.');
  
  return user;
}

async function upsertTags(tagNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const tag = await db.tag.upsert({
      where: { slug },
      update: {},
      create: { name: name.trim(), slug },
    });
    ids.push(tag.id);
  }
  return ids;
}

export async function createMemberArticleAction(data: MemberArticleFormData): Promise<ActionResult> {
  const user = await requireWriter();

  const existing = await db.article.findUnique({ where: { slug: data.slug } });
  if (existing) return { success: false, error: 'Slug đã tồn tại.' };

  const topic = await db.topic.findUnique({ where: { id: data.topicId } });
  if (!topic) return { success: false, error: 'Chủ đề không hợp lệ hoặc không tồn tại.' };

  const tagIds = await upsertTags(data.tags ?? []);

  const article = await db.article.create({
    data: {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      overview: data.overview,
      objectives: data.objectives,
      content: data.content,
      cover: data.cover,
      coverPosition: data.coverPosition,
      thumbnail: data.thumbnail,
      thumbnailPosition: data.thumbnailPosition,
      topicId: data.topicId,
      audience: 'MEMBERS',
      status: 'DRAFT',
      readTime: data.readTime ?? 5,
      authorId: user.id,
      tags: { create: tagIds.map(tagId => ({ tagId })) },
    },
  });

  revalidatePath(`/@${user.username || user.id}`);
  return { success: true, id: article.id };
}

export async function updateArticleQuickAction(
  id: string,
  patch: { status?: ArticleStatus; audience?: ArticleAudience; rejectionReason?: string; badges?: ArticleBadge[] }
) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role !== 'ADMIN') {
      return { success: false, error: 'Chỉ quản trị viên mới có quyền thực hiện thao tác này.' };
    }

    const updateData: any = { ...patch };

    // If status is PUBLISHED, ensure publishedAt is set
    if (patch.status === 'PUBLISHED') {
      const current = await db.article.findUnique({ where: { id }, select: { publishedAt: true } });
      if (!current?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updated = await db.article.update({
      where: { id },
      data: updateData,
      include: { author: { select: { id: true, name: true } } }
    });
    
    // Send Notifications
    if (patch.status === 'PUBLISHED') {
      // 1. Notify the author
      await createNotificationAction(
        updated.authorId,
        NotificationType.ARTICLE_APPROVED,
        `Bài viết "${updated.title}" được phê duyệt!`,
        { 
          message: 'Chúc mừng! Bài viết của bạn đã được xuất bản chính thức.',
          link: `/me?tab=published` 
        }
      );

      // 2. Trigger global event (logs activity, notifies other users)
      const author = await db.user.findUnique({
        where: { id: updated.authorId },
        select: { name: true }
      });

      eventBus.emit(EVENTS.ARTICLE_PUBLISHED, {
        articleId: updated.id,
        slug: updated.slug,
        title: updated.title,
        actorId: updated.authorId,
        authorName: author?.name || 'Thành viên',
      });

      // 3. Revalidate related paths
      revalidatePath('/');
      revalidatePath(`/article/${updated.slug}`);
    } else if (patch.status === 'REJECTED') {
      await createNotificationAction(
        updated.authorId,
        NotificationType.ARTICLE_REJECTED,
        `Bài phản hồi về nội dung: ${updated.title}`,
        { 
          message: patch.rejectionReason || 'Vui lòng kiểm tra lại nội dung và chỉnh sửa theo yêu cầu của Admin.',
          link: `/write/${updated.id}` 
        }
      );
    }
    
    revalidatePath('/admin/documents');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMemberArticleAction(id: string, data: Partial<MemberArticleFormData>): Promise<ActionResult> {
  const user = await requireWriter();

  const article = await db.article.findUnique({ where: { id } });
  if (!article) return { success: false, error: 'Bài viết không tồn tại.' };
  if (article.authorId !== user.id) return { success: false, error: 'Bạn chỉ có thể sửa bài viết của mình.' };
  if (article.status === 'PUBLISHED') return { success: false, error: 'Không thể sửa bài đã được duyệt. Liên hệ admin.' };

  if (data.tags !== undefined) {
    const tagIds = await upsertTags(data.tags);
    await db.articleTag.deleteMany({ where: { articleId: id } });
    await db.articleTag.createMany({ data: tagIds.map(tagId => ({ articleId: id, tagId })) });
  }

  await db.article.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.slug && { slug: data.slug }),
      ...(data.summary !== undefined && { summary: data.summary }),
      ...(data.overview !== undefined && { overview: data.overview }),
      ...(data.objectives !== undefined && { objectives: data.objectives }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.cover !== undefined && { cover: data.cover }),
      ...(data.coverPosition !== undefined && { coverPosition: data.coverPosition }),
      ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
      ...(data.thumbnailPosition !== undefined && { thumbnailPosition: data.thumbnailPosition }),
      ...(data.topicId && { topicId: data.topicId }),
      ...(data.readTime && { readTime: data.readTime }),
    },
  });

  revalidatePath(`/@${user.username || user.id}`);
  return { success: true, id };
}

export async function deleteMemberArticleAction(id: string): Promise<ActionResult> {
  const user = await requireWriter();

  const article = await db.article.findUnique({ where: { id } });
  if (!article) return { success: false, error: 'Bài viết không tồn tại.' };
  if (article.authorId !== user.id) return { success: false, error: 'Bạn chỉ có thể xoá bài viết của mình.' };
  if (article.status === 'PUBLISHED') return { success: false, error: 'Không thể xoá bài đã được duyệt. Liên hệ admin.' };

  await db.article.delete({ where: { id } });

  revalidatePath(`/@${user.username || user.id}`);
  return { success: true, id };
}

export async function submitMemberArticleAction(id: string): Promise<ActionResult> {
  const user = await requireWriter();

  const article = await db.article.findUnique({ where: { id } });
  if (!article) return { success: false, error: 'Bài viết không tồn tại.' };
  if (article.authorId !== user.id) return { success: false, error: 'Bạn chỉ có thể gửi bài viết của mình.' };
  
  if (article.status !== 'DRAFT' && article.status !== 'REJECTED') {
    return { success: false, error: 'Bài viết đang được xử lý, không thể gửi lại.' };
  }

  const isResubmit = article.status === 'REJECTED';

  await db.article.update({
    where: { id },
    data: {
      status: 'PENDING',
      // Xoá lý do từ chối cũ khi resubmit để UI admin/member không hiển thị stale
      ...(isResubmit && { rejectionReason: null }),
    },
  });

  // Notify Admins — song song và không chặn response nếu 1 admin lỗi
  const admins = await db.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true }
  });

  const title = isResubmit
    ? `Yêu cầu phê duyệt lại`
    : `Yêu cầu phê duyệt mới`;
  const message = isResubmit
    ? `${user.name || 'Thành viên'} vừa gửi lại bài viết "${article.title}" sau chỉnh sửa.`
    : `Bài viết "${article.title}" vừa được gửi bởi ${user.name || 'Thành viên'}.`;

  await Promise.allSettled(
    admins.map(admin =>
      createNotificationAction(
        admin.id,
        NotificationType.ARTICLE_SUBMITTED,
        title,
        { message, link: `/admin/documents?tab=pending` },
      ),
    ),
  );

  revalidatePath(`/@${user.username || user.id}`);
  revalidatePath('/admin/documents');
  return { success: true, id };
}

export async function getMemberDraftsAction(): Promise<{
  articles: Array<{
    id: string; title: string; slug: string; summary: string | null;
    status: 'DRAFT' | 'PENDING' | 'REJECTED';
    topicId: string; createdAt: Date; updatedAt: Date;
    content: string; thumbnail: string | null;
    topic: { label: string; slug: string; color: string | null };
  }>;
}> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { articles: [] };

  const articles = await db.article.findMany({
    where: {
      authorId: userId,
      status: { in: ['DRAFT', 'PENDING' as any, 'REJECTED' as any] }
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      status: true,
      content: true,
      topicId: true,
      createdAt: true,
      updatedAt: true,
      thumbnail: true,
      topic: {
        select: {
          label: true,
          slug: true,
          color: true
        }
      }
    }
  });

  return { articles: articles as any };
}

export async function getMemberArticleByIdAction(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const article = await db.article.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      topic: { select: { id: true, label: true, slug: true } },
    },
  });

  if (!article || article.authorId !== userId) return null;
  return article;
}
