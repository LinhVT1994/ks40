import 'server-only';
import { db } from '@/lib/db';
import { NotificationType } from '@prisma/client';
import { pushToUser } from '@/lib/sse';

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
