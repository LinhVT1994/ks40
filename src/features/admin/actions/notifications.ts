'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NotificationType } from '@prisma/client';
import { pushToUser, broadcastToAll } from '@/lib/sse';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');
}

export async function getAdminNotificationsAction({
  page = 1,
  limit = 30,
  type,
  read,
  q,
}: {
  page?: number;
  limit?: number;
  type?: string;
  read?: string;
  q?: string;
} = {}) {
  await requireAdmin();

  const where = {
    ...(type && type !== 'all' ? { type: type as NotificationType } : {}),
    ...(read === 'true' ? { read: true } : read === 'false' ? { read: false } : {}),
    ...(q?.trim()
      ? {
          OR: [
            { title: { contains: q.trim(), mode: 'insensitive' as const } },
            { user: { name: { contains: q.trim(), mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    }),
    db.notification.count({ where }),
  ]);

  return { notifications, total, pages: Math.ceil(total / limit), page };
}

export async function getNotificationStatsAction() {
  await requireAdmin();

  const [total, unread, byType] = await Promise.all([
    db.notification.count(),
    db.notification.count({ where: { read: false } }),
    db.notification.groupBy({ by: ['type'], _count: { _all: true } }),
  ]);

  return { total, unread, byType };
}

export async function sendNotificationAction({
  userId,
  userIds,
  broadcast,
  type,
  title,
  message,
  link,
}: {
  userId?: string;
  userIds?: string[];
  broadcast?: boolean;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
}) {
  await requireAdmin();

  if (broadcast) {
    const users = await db.user.findMany({ select: { id: true } });
    await db.notification.createMany({
      data: users.map((u) => ({ userId: u.id, type, title, message, link })),
    });
    const notifBase = { type, title, message: message ?? null, link: link ?? null, read: false, createdAt: new Date() };
    broadcastToAll('notification', notifBase);
    return { sent: users.length };
  }

  // Support both single userId and multiple userIds
  const targets = userIds?.length ? userIds : userId ? [userId] : [];
  if (!targets.length) throw new Error('userId or userIds is required');

  await db.notification.createMany({
    data: targets.map((uid) => ({ userId: uid, type, title, message, link })),
  });
  for (const uid of targets) {
    const notif = await db.notification.findFirst({ where: { userId: uid, type, title }, orderBy: { createdAt: 'desc' } });
    if (notif) pushToUser(uid, 'notification', notif);
  }
  return { sent: targets.length };
}

export async function deleteNotificationAction(id: string) {
  await requireAdmin();
  await db.notification.delete({ where: { id } });
}

export async function deleteReadNotificationsAction() {
  await requireAdmin();
  const { count } = await db.notification.deleteMany({ where: { read: true } });
  return { deleted: count };
}
