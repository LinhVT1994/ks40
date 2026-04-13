"use client";

import React, { useEffect, useState } from 'react';
import { X, Lock, UserCheck, FileText, Eye, Calendar, Clock, PenLine, Save, Loader2 } from 'lucide-react';
import { User, UserRole, ROLE_CONFIG, STATUS_CONFIG, USER_ROLES } from '@/features/admin/data/users';

interface Props {
  user: User | null;
  mode: 'view' | 'edit';
  isPending?: boolean;
  onClose: () => void;
  onSave: (id: string, changes: { role?: UserRole; canWrite?: boolean; status?: 'active' | 'locked' }) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function UserDetailModal({ user, mode, isPending, onClose, onSave }: Props) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [draftRole, setDraftRole] = useState<UserRole | null>(null);
  const [draftCanWrite, setDraftCanWrite] = useState<boolean | null>(null);
  const [draftStatus, setDraftStatus] = useState<'active' | 'locked' | null>(null);

  // Reset draft khi user thay đổi
  useEffect(() => {
    setDraftRole(null);
    setDraftCanWrite(null);
    setDraftStatus(null);
    setRoleDropdownOpen(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [user, onClose]);

  if (!user) return null;

  // Giá trị hiển thị: draft nếu có, fallback về user gốc
  const currentRole = draftRole ?? user.role;
  const currentCanWrite = draftCanWrite ?? user.canWrite;
  const currentStatus = draftStatus ?? user.status;

  const role = ROLE_CONFIG[currentRole];
  const status = STATUS_CONFIG[currentStatus];

  const hasChanges = draftRole !== null || draftCanWrite !== null || draftStatus !== null;

  const handleSave = () => {
    const changes: { role?: UserRole; canWrite?: boolean; status?: 'active' | 'locked' } = {};
    if (draftRole !== null && draftRole !== user.role) changes.role = draftRole;
    if (draftCanWrite !== null && draftCanWrite !== user.canWrite) changes.canWrite = draftCanWrite;
    if (draftStatus !== null && draftStatus !== user.status) changes.status = draftStatus;
    if (Object.keys(changes).length > 0) {
      onSave(user.id, changes);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-zinc-300 dark:border-white/10 shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/5">
          <h2 className="text-base font-bold text-zinc-800 dark:text-white">{mode === 'edit' ? 'Chỉnh sửa người dùng' : 'Chi tiết người dùng'}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile */}
        <div className="px-6 pt-5 pb-4 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl bg-cover bg-center border border-zinc-300 dark:border-white/10 shrink-0"
            style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e2e8f0&color=0f172a&size=128')` }}
          />
          <div className="min-w-0">
            <p className="text-lg font-bold text-zinc-800 dark:text-white truncate">{user.name}</p>
            <p className="text-sm text-zinc-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${role.className}`}>{role.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
              {currentCanWrite && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Writer</span>}
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
            <div key={label} className="bg-zinc-50 dark:bg-white/5 rounded-xl p-3 text-center border border-zinc-200 dark:border-white/5">
              <Icon className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-zinc-800 dark:text-white">{value}</p>
              <p className="text-[11px] text-zinc-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Last active */}
        <div className="mx-6 mb-5 flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="w-3.5 h-3.5" />
          Hoạt động lần cuối: <span className="font-semibold text-zinc-500 dark:text-slate-300">{formatDate(user.lastActive)}</span>
        </div>

        <div className="border-t border-zinc-200 dark:border-white/5" />

        {mode === 'edit' ? (
          <>
            <div className="px-6 py-4 space-y-4">
              {/* Role */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Vai trò</p>
                <div className="relative">
                  <button
                    onClick={() => setRoleDropdownOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-colors dark:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${role.className}`}>{role.label}</span>
                      {draftRole && draftRole !== user.role
                        ? <span className="text-xs text-amber-500">( đã thay đổi )</span>
                        : 'Vai trò hiện tại'}
                    </span>
                    <svg className={`w-4 h-4 text-zinc-500 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {roleDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-zinc-300 dark:border-white/10 rounded-xl shadow-lg z-10 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                      {USER_ROLES.map(r => {
                        const cfg = ROLE_CONFIG[r];
                        const isSelected = r === currentRole;
                        return (
                          <button
                            key={r}
                            onClick={() => { setDraftRole(r); setRoleDropdownOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${
                              isSelected
                                ? 'bg-primary/5'
                                : 'hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer'
                            }`}
                          >
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>
                            <span className="text-zinc-600 dark:text-slate-300 font-medium">{r}</span>
                            {isSelected && <span className="ml-auto text-[11px] text-primary font-bold">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* canWrite */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Quyền viết bài</p>
                <button
                  onClick={() => setDraftCanWrite(prev => !(prev ?? user.canWrite))}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                    currentCanWrite
                      ? 'border-primary/30 bg-primary/5 text-primary'
                      : 'border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <PenLine className="w-4 h-4" />
                    {currentCanWrite ? 'Có quyền viết bài' : 'Chưa có quyền viết bài'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    currentCanWrite ? 'bg-primary/10 text-primary' : 'bg-zinc-100 dark:bg-white/10 text-zinc-500'
                  }`}>
                    {currentCanWrite ? 'Bật' : 'Tắt'}
                  </span>
                </button>
              </div>

              {/* Status */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Trạng thái</p>
                <button
                  onClick={() => setDraftStatus(prev => (prev ?? user.status) === 'active' ? 'locked' : 'active')}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                    currentStatus === 'active'
                      ? 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                      : 'border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {currentStatus === 'active' ? <UserCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {currentStatus === 'active' ? 'Đang hoạt động' : 'Đã khoá'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.className}`}>
                    {status.label}
                  </span>
                </button>
              </div>
            </div>

            {/* Footer — edit */}
            <div className="flex items-center gap-2 px-6 py-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] rounded-b-2xl">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-300 dark:border-white/10 text-zinc-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isPending}
                className="ml-auto flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-all shadow-sm"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-300 dark:border-white/10 text-zinc-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-colors"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
