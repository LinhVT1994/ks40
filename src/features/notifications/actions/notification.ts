'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NotificationType } from '@prisma/client';
import { pushToUser } from '@/lib/sse';

export async function getNotificationsAction() {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return { notifications: [], unreadCount: 0 };

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      take:    30,
    }),
    db.notification.count({ where: { userId, read: false } }),
  ]);

  return { notifications, unreadCount };
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

// Dùng nội bộ — tạo notification cho user
export async function createNotificationAction(
  userId: string,
  type: NotificationType,
  title: string,
  options?: { message?: string; link?: string },
) {
  const notif = await db.notification.create({
    data: { userId, type, title, ...options },
  });

  // Push real-time to connected SSE clients
  pushToUser(userId, 'notification', notif);
}
