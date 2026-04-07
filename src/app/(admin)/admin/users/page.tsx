import AdminHeader from '@/features/admin/components/AdminHeader';
import UsersClient from '@/features/admin/components/UsersClient';
import { getAdminUsersAction } from '@/features/admin/actions/user';
import { Role, UserStatus } from '@prisma/client';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; status?: string; page?: string }>;
}) {
  const params  = await searchParams;
  const page    = Number(params.page ?? 1);
  const search  = params.search?.trim();
  const role    = params.role   as Role       | undefined;
  const status  = params.status as UserStatus | undefined;

  const { users, total, totalPages, counts } = await getAdminUsersAction({
    search, role, status, page, limit: 10,
  });

  return (
    <>
      <AdminHeader breadcrumb={[{ label: 'Admin', href: '/admin/overview' }, { label: 'Người dùng' }]} />
      <UsersClient
        users={users}
        total={total}
        totalPages={totalPages}
        currentPage={page}
        counts={counts}
      />
    </>
  );
}
