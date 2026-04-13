'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NotificationType } from '@prisma/client';
import { pushToUser } from '@/lib/sse';

export async function getNotificationsAction(options: { 
  page?: number; 
  limit?: number; 
  filter?: 'all' | 'unread' | 'read' 
} = {}) {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return { notifications: [], unreadCount: 0, hasNextPage: false, totalCount: 0 };

  const { page = 1, limit = 20, filter = 'all' } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (filter === 'unread') where.read = false;
  else if (filter === 'read') where.read = true;

  const [notifications, unreadCount, totalCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.notification.count({ where: { userId, read: false } }),
    db.notification.count({ where }),
  ]);

  return { 
    notifications, 
    unreadCount, 
    totalCount,
    hasNextPage: totalCount > skip + notifications.length 
  };
}

export async function markAsReadAction(notificationId: string) {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return;

  await db.notification.updateMany({
    where: { id: notificationId, userId },
    data:  { read: true },
  });
}

export async function markAllAsReadAction() {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return;

  await db.notification.updateMany({
    where: { userId, read: false },
    data:  { read: true },
  });
}

// Dùng nội bộ — tạo notification cho user.
// Bọc try/catch vì hàm này thường được gọi fire-and-forget (`void createNotificationAction(...)`)
// → unhandled rejection sẽ làm crash Node process.
export async function createNotificationAction(
  userId: string,
  type: NotificationType,
  title: string,
  options?: { message?: string; link?: string },
) {
  try {
    const notif = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message: options?.message,
        link:    options?.link,
      },
    });

    // Push real-time to connected SSE clients
    pushToUser(userId, 'notification', notif);
  } catch (err) {
    console.error('[createNotificationAction] failed', { userId, type, title, err });
  }
}
