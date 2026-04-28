import type { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getNotificationsAction } from '@/features/notifications/actions/notification';
import NotificationsClient from './NotificationsClient';
import BackButton from '@/components/shared/BackButton';

export const metadata: Metadata = { 
  title:  'Thông báo',
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { notifications, unreadCount, hasNextPage, totalCount } = await getNotificationsAction({
    page: 1,
    limit: 20,
    filter: 'all'
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6 flex justify-center sm:justify-start">
        <BackButton fallbackUrl="/" />
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white tracking-tight text-center sm:text-left">Thông báo</h1>
        <p className="text-sm text-zinc-500 mt-1 text-center sm:text-left">
          {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã đọc hết thông báo'}
        </p>
      </div>
      <NotificationsClient 
        initialNotifications={notifications as any} 
        initialUnreadCount={unreadCount}
        initialHasNextPage={hasNextPage}
        initialTotalCount={totalCount}
      />
    </div>
  );
}
