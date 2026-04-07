import AdminHeader from '@/features/admin/components/AdminHeader';
import { getAdminNotificationsAction, getNotificationStatsAction } from '@/features/admin/actions/notifications';
import { getSiteConfigAction } from '@/features/admin/actions/config';
import type { SiteAnnouncement } from '@/features/admin/actions/config';
import { db } from '@/lib/db';
import NotificationsAdminClient from './NotificationsAdminClient';

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; read?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1') || 1);

  const [{ notifications, total, pages }, stats, users, announcementRaw] = await Promise.all([
    getAdminNotificationsAction({
      page,
      type: params.type,
      read: params.read,
      q: params.q,
    }),
    getNotificationStatsAction(),
    db.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
    getSiteConfigAction('site_announcement'),
  ]);
  const announcement = (announcementRaw as SiteAnnouncement | null) ?? null;

  return (
    <>
      <AdminHeader
        breadcrumb={[{ label: 'Admin', href: '/admin/overview' }, { label: 'Thông báo' }]}
      />
      <div className="flex-1 p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Quản lý thông báo</h1>
          <p className="text-sm text-slate-500 mt-1">Gửi và quản lý thông báo đến người dùng</p>
        </div>

        <NotificationsAdminClient
          notifications={notifications as any}
          stats={stats}
          users={users}
          announcement={announcement}
          total={total}
          pages={pages}
          currentPage={page}
          currentType={params.type ?? 'all'}
          currentRead={params.read ?? 'all'}
          currentQ={params.q ?? ''}
        />
      </div>
    </>
  );
}
