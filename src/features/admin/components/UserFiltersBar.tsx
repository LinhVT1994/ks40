import React from 'react';
import { Search } from 'lucide-react';
import { UserRole, UserStatus } from '@/features/admin/data/users';

type RoleFilter = UserRole | 'all';
type StatusFilter = UserStatus | 'all';
export type UserSortKey = 'name' | 'joinedAt' | 'docsViewed' | 'articlesWritten' | 'lastActive';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  activeRole: RoleFilter;
  onRoleChange: (v: RoleFilter) => void;
  activeStatus: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  sortKey: UserSortKey;
  onSortChange: (v: UserSortKey) => void;
  counts: { all: number; Admin: number; Premium: number; Member: number; active: number; locked: number };
}

const selectClass = 'px-3 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-slate-700 cursor-pointer';

export default function UserFiltersBar({
  search, onSearchChange, activeRole, onRoleChange, activeStatus, onStatusChange, sortKey, onSortChange, counts,
}: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên, email..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-slate-400"
        />
      </div>
      <div className="md:ml-auto flex items-center gap-3">
        <select value={activeRole} onChange={e => onRoleChange(e.target.value as RoleFilter)} className={selectClass}>
          <option value="all">Tất cả vai trò ({counts.all})</option>
          <option value="Admin">Admin ({counts.Admin})</option>
          <option value="Premium">Premium ({counts.Premium})</option>
          <option value="Member">Member ({counts.Member})</option>
        </select>
        <select value={activeStatus} onChange={e => onStatusChange(e.target.value as StatusFilter)} className={selectClass}>
          <option value="all">Mọi trạng thái</option>
          <option value="active">Hoạt động ({counts.active})</option>
          <option value="locked">Đã khoá ({counts.locked})</option>
        </select>
        <select value={sortKey} onChange={e => onSortChange(e.target.value as UserSortKey)} className={selectClass}>
          <option value="joinedAt">Ngày tham gia</option>
          <option value="lastActive">Hoạt động gần nhất</option>
          <option value="name">Tên A→Z</option>
          <option value="docsViewed">Tài liệu đã xem</option>
          <option value="articlesWritten">Bài viết</option>
        </select>
      </div>
    </div>
  );
}
