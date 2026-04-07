import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import NotificationsClient from './NotificationsClient';

export const metadata = { title: 'Thông báo' };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thông báo</h1>
        <p className="text-sm text-slate-500 mt-1">
          {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
        </p>
      </div>
      <NotificationsClient initialNotifications={notifications as any} />
    </div>
  );
}
