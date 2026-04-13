"use client";

import React from 'react';
import { Lock, UserCheck, Eye, UserMinus2, PenLine } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { User, ROLE_CONFIG, STATUS_CONFIG } from '@/features/admin/data/users';

function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-semibold text-white bg-zinc-800 dark:bg-slate-700 rounded-lg whitespace-nowrap opacity-0 scale-95 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:scale-100 transition-all duration-150 z-30">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-zinc-800 dark:border-t-slate-700" />
      </div>
    </div>
  );
}

interface Props {
  users: User[];
  onView: (u: User) => void;
  onEdit: (u: User) => void;
  onToggleStatus: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function UserTable({ users, onView, onEdit, onToggleStatus }: Props) {

  return (
    <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm relative flex flex-col min-w-[800px]">
      {/* Header */}
      <div className="grid grid-cols-12 px-6 py-3 border-b border-zinc-200 dark:border-white/5 text-[11px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-50/90 dark:bg-slate-900/90 backdrop-blur-md rounded-t-2xl sticky top-[65px] md:top-[73px] z-20">
        <div className="col-span-4">Người dùng</div>
        <div className="col-span-2">Vai trò</div>
        <div className="col-span-1 text-center">Bài viết</div>
        <div className="col-span-2 text-center">Tài liệu đã xem</div>
        <div className="col-span-1">Ngày tham gia</div>
        <div className="col-span-1 text-center">Trạng thái</div>
        <div className="col-span-1"></div>
      </div>

      {/* Body */}
      <div className="divide-y divide-zinc-200 dark:divide-white/5">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <UserMinus2 className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">Không tìm thấy người dùng nào</p>
            <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          users.map(user => {
            const role = ROLE_CONFIG[user.role];
            const status = STATUS_CONFIG[user.status];
            return (
              <div key={user.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group">
                {/* Avatar + info */}
                <div className="col-span-4 flex items-center gap-3">
                  <Avatar src={null} name={user.name} size={36} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-800 dark:text-white truncate group-hover:text-primary transition-colors">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="col-span-2 flex items-center gap-1.5">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${role.className}`}>{role.label}</span>
                  {user.canWrite && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">Writer</span>
                  )}
                </div>

                {/* Articles written */}
                <div className="col-span-1 text-center text-sm font-bold text-zinc-700 dark:text-slate-300">
                  {user.articlesWritten}
                </div>

                {/* Docs viewed */}
                <div className="col-span-2 text-center text-sm font-bold text-zinc-700 dark:text-slate-300">
                  {user.docsViewed.toLocaleString()}
                </div>

                {/* Joined */}
                <div className="col-span-1 text-sm text-zinc-500">{formatDate(user.joinedAt)}</div>

                {/* Status */}
                <div className="col-span-1 text-center">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip label="Xem chi tiết">
                    <button
                      onClick={() => onView(user)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-zinc-500 hover:text-primary transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip label="Chỉnh sửa">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-zinc-500 hover:text-primary transition-colors"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip label={user.status === 'active' ? 'Khoá tài khoản' : 'Mở khoá'}>
                    <button
                      onClick={() => onToggleStatus(user.id)}
                      className={`p-1.5 rounded-lg transition-colors text-zinc-500 ${
                        user.status === 'active'
                          ? 'hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500'
                          : 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-500'
                      }`}
                    >
                      {user.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </button>
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
