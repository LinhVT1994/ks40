'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import UserStatsCards from './UserStatsCards';
import UserFiltersBar, { UserSortKey } from './UserFiltersBar';
import UserTable from './UserTable';
import UserDetailModal from './UserDetailModal';
import AdminPagination from './AdminPagination';
import type { User, UserRole, UserStatus } from '@/features/admin/data/users';
import type { AdminUser } from '@/features/admin/actions/user';
import { updateUserRoleAction, toggleUserStatusAction } from '@/features/admin/actions/user';
import { Role } from '@prisma/client';

type RoleFilter   = UserRole | 'all';
type StatusFilter = UserStatus | 'all';

function toUser(u: AdminUser): User {
  const roleMap: Record<string, UserRole> = {
    ADMIN: 'Admin', PREMIUM: 'Premium', MEMBER: 'Member',
  };
  const statusMap: Record<string, UserStatus> = {
    ACTIVE: 'active', LOCKED: 'locked',
  };
  return {
    id:              u.id,
    name:            u.name,
    email:           u.email,
    role:            roleMap[u.role] ?? 'Member',
    status:          statusMap[u.status] ?? 'active',
    joinedAt:        u.createdAt instanceof Date ? u.createdAt.toISOString().slice(0, 10) : String(u.createdAt),
    lastActive:      u.createdAt instanceof Date ? u.createdAt.toISOString().slice(0, 10) : String(u.createdAt),
    docsViewed:      u._count.readHistories,
    articlesWritten: u._count.articles,
  };
}

const ROLE_UP_MAP: Record<UserRole, Role> = {
  Admin: Role.ADMIN, Premium: Role.PREMIUM, Member: Role.MEMBER,
};

export default function UsersClient({
  users: initialUsers,
  total,
  totalPages,
  currentPage,
  counts: serverCounts,
}: {
  users: AdminUser[];
  total: number;
  totalPages: number;
  currentPage: number;
  counts: { all: number; Admin: number; Premium: number; Member: number; active: number; locked: number };
}) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [localUsers,   setLocalUsers]   = useState<User[]>(initialUsers.map(toUser));
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sortKey,      setSortKey]      = useState<UserSortKey>('joinedAt');

  useEffect(() => {
    setLocalUsers(initialUsers.map(toUser));
  }, [initialUsers]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const sortedUsers = [...localUsers].sort((a, b) => {
    switch (sortKey) {
      case 'name':            return a.name.localeCompare(b.name, 'vi');
      case 'docsViewed':      return b.docsViewed - a.docsViewed;
      case 'articlesWritten': return b.articlesWritten - a.articlesWritten;
      case 'lastActive':      return b.lastActive.localeCompare(a.lastActive);
      case 'joinedAt':
      default:                return b.joinedAt.localeCompare(a.joinedAt);
    }
  });

  const handleToggleStatus = (id: string) => {
    setLocalUsers(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === 'active' ? 'locked' : 'active' } : u
    ));
    setSelectedUser(prev => prev?.id === id
      ? { ...prev, status: prev.status === 'active' ? 'locked' : 'active' }
      : prev
    );
    startTransition(async () => { await toggleUserStatusAction(id); });
  };

  const handleChangeRole = (id: string, role: UserRole) => {
    setLocalUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    setSelectedUser(prev => prev?.id === id ? { ...prev, role } : prev);
    startTransition(async () => { await updateUserRoleAction(id, ROLE_UP_MAP[role]); });
  };

  const roleParam   = searchParams.get('role')   ?? '';
  const statusParam = searchParams.get('status') ?? '';

  const roleFromUrl: Record<string, UserRole> = { ADMIN: 'Admin', PREMIUM: 'Premium', MEMBER: 'Member' };
  const activeRole   = (roleParam   ? (roleFromUrl[roleParam]   ?? 'all') : 'all') as RoleFilter;
  const activeStatus = (statusParam ? (statusParam.toLowerCase() as UserStatus) : 'all') as StatusFilter;

  return (
    <>
      <div className="flex-1 p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Quản lý Người dùng</h1>
          <p className="text-sm text-slate-500 mt-1">{total} thành viên trong hệ thống</p>
        </div>

        <UserStatsCards users={localUsers} />

        <UserFiltersBar
          search={searchParams.get('search') ?? ''}
          onSearchChange={v => updateParam('search', v)}
          activeRole={activeRole}
          onRoleChange={v => { if (v === 'all') updateParam('role', ''); else updateParam('role', v.toUpperCase()); }}
          activeStatus={activeStatus}
          onStatusChange={v => { if (v === 'all') updateParam('status', ''); else updateParam('status', v.toUpperCase()); }}
          sortKey={sortKey}
          onSortChange={setSortKey}
          counts={serverCounts}
        />

        <UserTable
          users={sortedUsers}
          onView={setSelectedUser}
          onToggleStatus={handleToggleStatus}
        />
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          label="người dùng"
          onPageChange={p => updateParam('page', String(p))}
        />
      </div>

      <UserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onToggleStatus={handleToggleStatus}
        onChangeRole={handleChangeRole}
      />
    </>
  );
}
