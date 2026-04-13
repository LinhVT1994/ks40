import AdminHeader from '@/features/admin/components/AdminHeader';
import { getActivitiesAction } from '@/features/admin/actions/activity';
import ActivityLogClient from './ActivityLogClient';

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1') || 1);
  const type = params.type ?? 'all';
  const q = params.q ?? '';

  const { activities, total, pages } = await getActivitiesAction({ page, type, q });

  return (
    <>
      <AdminHeader breadcrumb={[{ label: 'Admin', href: '/admin/overview' }, { label: 'Hoạt động' }]} />
      <div className="flex-1 p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-white font-display">Nhật ký hoạt động</h1>
          <p className="text-sm text-zinc-500 mt-1">{total.toLocaleString('vi-VN')} sự kiện được ghi lại</p>
        </div>

        <ActivityLogClient
          activities={activities as any}
          total={total}
          pages={pages}
          currentPage={page}
          currentType={type}
          currentQ={q}
        />
      </div>
    </>
  );
}
