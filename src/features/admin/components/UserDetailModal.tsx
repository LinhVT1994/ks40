"use client";

import React, { useEffect, useState } from 'react';
import { X, Lock, UserCheck, FileText, Eye, Calendar, Clock } from 'lucide-react';
import { User, UserRole, ROLE_CONFIG, STATUS_CONFIG, USER_ROLES } from '@/features/admin/data/users';

interface Props {
  user: User | null;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
  onChangeRole: (id: string, role: UserRole) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function UserDetailModal({ user, onClose, onToggleStatus, onChangeRole }: Props) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [user, onClose]);

  if (!user) return null;

  const role = ROLE_CONFIG[user.role];
  const status = STATUS_CONFIG[user.status];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Chi tiết người dùng</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile */}
        <div className="px-6 pt-5 pb-4 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl bg-cover bg-center border border-slate-200 dark:border-white/10 shrink-0"
            style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e2e8f0&color=0f172a&size=128')` }}
          />
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
            <p className="text-sm text-slate-400 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${role.className}`}>{role.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-6 mb-4 grid grid-cols-3 gap-3">
          {[
            { icon: FileText, label: 'Bài viết', value: user.articlesWritten },
            { icon: Eye,      label: 'Đã xem',   value: user.docsViewed      },
            { icon: Calendar, label: 'Tham gia',  value: formatDate(user.joinedAt) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 text-center border border-slate-100 dark:border-white/5">
              <Icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
              <p className="text-[11px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Last active */}
        <div className="mx-6 mb-5 flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          Hoạt động lần cuối: <span className="font-semibold text-slate-500 dark:text-slate-300">{formatDate(user.lastActive)}</span>
        </div>

        <div className="border-t border-slate-100 dark:border-white/5" />

        {/* Role change */}
        <div className="px-6 py-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Thay đổi vai trò</p>
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-colors dark:text-white"
            >
              <span className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${role.className}`}>{role.label}</span>
                Vai trò hiện tại
              </span>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {roleDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg z-10 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                {USER_ROLES.map(r => {
                  const cfg = ROLE_CONFIG[r];
                  const isCurrentRole = r === user.role;
                  return (
                    <button
                      key={r}
                      onClick={() => { if (!isCurrentRole) { onChangeRole(user.id, r); setRoleDropdownOpen(false); } }}
                      disabled={isCurrentRole}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${
                        isCurrentRole
                          ? 'bg-slate-50 dark:bg-white/5 cursor-not-allowed'
                          : 'hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer'
                      }`}
                    >
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{r}</span>
                      {isCurrentRole && <span className="ml-auto text-[11px] text-slate-400">Hiện tại</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] rounded-b-2xl">
          <button
            onClick={() => { onToggleStatus(user.id); onClose(); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${
              user.status === 'active'
                ? 'border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                : 'border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
            }`}
          >
            {user.status === 'active' ? <Lock className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            {user.status === 'active' ? 'Khoá tài khoản' : 'Mở khoá tài khoản'}
          </button>
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
