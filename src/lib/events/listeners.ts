import { eventBus, EVENTS } from './bus';
import { db } from '@/lib/db';
import { ActivityType, NotificationType } from '@prisma/client';
import { pushToUser } from '@/lib/sse';

// Dùng globalThis để flag này sống sót qua HMR re-evaluation
const g = global as typeof global & { _listenersRegistered?: boolean };

export function registerEventListeners() {
  if (g._listenersRegistered) return;
  g._listenersRegistered = true;

  console.log('🔌 Khởi tạo Listener cho Event-Driven Activity Log...');

  // ── 1. User đăng ký → ghi Activity (idempotent) ────────────
  eventBus.on(EVENTS.USER_REGISTERED, async (payload: { userId: string; name: string }) => {
    try {
      // Chỉ tạo 1 bản ghi duy nhất cho mỗi user — tránh duplicate khi listener bị đăng ký nhiều lần
      const existing = await db.activity.findFirst({
        where: { type: ActivityType.USER_REGISTERED, actorId: payload.userId },
      });
      if (existing) return;

      await db.activity.create({
        data: {
          type: ActivityType.USER_REGISTERED,
          message: `Người dùng mới **${payload.name}** vừa đăng ký tài khoản.`,
          actorId: payload.userId,
        },
      });
    } catch (error) {
      console.error('❌ Lỗi khi ghi log USER_REGISTERED:', error);
    }
  });

  // ── 2. Bài viết được đăng → ghi Activity + notify all users ─
  eventBus.on(EVENTS.ARTICLE_PUBLISHED, async (payload: {
    articleId: string; slug: string; title: string; actorId: string; authorName: string;
  }) => {
    try {
      // Ghi activity log (idempotent theo link)
      const existingActivity = await db.activity.findFirst({
        where: { type: ActivityType.ARTICLE_PUBLISHED, link: `/article/${payload.slug}` },
      });
      if (!existingActivity) {
        await db.activity.create({
          data: {
            type: ActivityType.ARTICLE_PUBLISHED,
            message: `**${payload.authorName}** vừa xuất bản bài viết **"${payload.title}"**.`,
            actorId: payload.actorId,
            link: `/article/${payload.slug}`,
          },
        });
      }

      // Tạo notification cho tất cả users (trừ tác giả) và push ngay khi mỗi record được tạo
      const users = await db.user.findMany({
        where: { id: { not: payload.actorId } },
        select: { id: true },
      });
      if (users.length === 0) return;

      const base = {
        type:    NotificationType.NEW_ARTICLE,
        title:   `Bài viết mới: "${payload.title}"`,
        message: `${payload.authorName} vừa đăng bài mới`,
        link:    `/article/${payload.slug}`,
      };

      // createManyAndReturn cho phép lấy id ngay, không cần findMany lần hai
      const created = await db.notification.createManyAndReturn({
        data: users.map(u => ({ userId: u.id, ...base })),
      });

      // Push SSE song song — không đợi tuần tự
      for (const notif of created) {
        pushToUser(notif.userId, 'notification', notif);
      }
    } catch (error) {
      console.error('❌ Lỗi khi xử lý ARTICLE_PUBLISHED:', error);
    }
  });

  // ── 3. Comment được đăng → ghi Activity ─────────────────────
  eventBus.on(EVENTS.COMMENT_POSTED, async (payload: {
    commentId: string; articleTitle: string; authorName: string; actorId: string; articleSlug: string;
  }) => {
    try {
      await db.activity.create({
        data: {
          type: ActivityType.COMMENT_POSTED,
          message: `**${payload.authorName}** vừa bình luận trong bài **"${payload.articleTitle}"**.`,
          actorId: payload.actorId,
          link: `/article/${payload.articleSlug}`,
        },
      });
    } catch (error) {
      console.error('❌ Lỗi khi ghi log COMMENT_POSTED:', error);
    }
  });
}
