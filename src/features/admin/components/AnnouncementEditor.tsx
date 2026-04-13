'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pin, PinOff, Loader2, CheckCheck, Wrench, AlertTriangle, Info, CheckCircle, X, Eye } from 'lucide-react';
import { setSiteConfigAction } from '@/features/admin/actions/config';
import type { SiteAnnouncement } from '@/features/admin/actions/config';

const ANN_TYPES: { key: SiteAnnouncement['type']; label: string; icon: React.ElementType; bg: string; text: string; border: string }[] = [
  { key: 'maintenance', label: 'Bảo trì',    icon: Wrench,        bg: 'bg-amber-500',   text: 'text-white', border: 'border-amber-500'   },
  { key: 'warning',     label: 'Cảnh báo',   icon: AlertTriangle, bg: 'bg-orange-500',  text: 'text-white', border: 'border-orange-500'  },
  { key: 'info',        label: 'Thông báo',  icon: Info,          bg: 'bg-primary',     text: 'text-white', border: 'border-primary'     },
  { key: 'success',     label: 'Thành công', icon: CheckCircle,   bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-500' },
];

export default function AnnouncementEditor({ initial }: { initial: SiteAnnouncement | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<SiteAnnouncement>(
    initial ?? { active: false, type: 'info', message: '', expiresAt: '' },
  );

  const set = (k: keyof SiteAnnouncement, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    startTransition(async () => {
      await setSiteConfigAction('site_announcement', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  };

  const deactivate = () => {
    startTransition(async () => {
      await setSiteConfigAction('site_announcement', { ...form, active: false });
      setForm(f => ({ ...f, active: false }));
      router.refresh();
    });
  };

  const cfg = ANN_TYPES.find(t => t.key === form.type) ?? ANN_TYPES[0];
  const Icon = cfg.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left: Form ── */}
      <div className="bg-white dark:bg-white/[0.02] border border-zinc-300 dark:border-white/10 rounded-2xl p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-white">Cấu hình banner</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Hiển thị thông báo ghim ở đầu trang cho tất cả người dùng</p>
        </div>

        {/* Type */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Loại</p>
          <div className="flex flex-wrap gap-2">
            {ANN_TYPES.map(t => {
              const TIcon = t.icon;
              const isActive = form.type === t.key;
              return (
                <button key={t.key} type="button" onClick={() => set('type', t.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-sm font-semibold transition-all w-fit ${
                    isActive
                      ? `${t.bg} ${t.text} ${t.border}`
                      : 'border-zinc-300 dark:border-white/10 text-zinc-600 dark:text-slate-400 hover:border-zinc-300 dark:hover:border-white/20 bg-zinc-50 dark:bg-white/5'
                  }`}>
                  <TIcon className="w-4 h-4 shrink-0" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Nội dung <span className="text-rose-400 normal-case">*</span>
          </p>
          <textarea
            value={form.message}
            onChange={e => set('message', e.target.value)}
            rows={3}
            placeholder="Hệ thống sẽ bảo trì vào Chủ nhật 02:00 – 04:00 AM..."
            className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white placeholder:text-zinc-500 resize-none transition-all"
          />
        </div>

        {/* Expiry */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Hiển thị đến (tuỳ chọn)</p>
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={form.expiresAt ?? ''}
              onChange={e => set('expiresAt', e.target.value || undefined)}
              className="flex-1 px-4 py-2.5 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white dark:[color-scheme:dark] transition-all"
            />
            {form.expiresAt && (
              <button type="button" onClick={() => set('expiresAt', '')}
                className="p-2.5 rounded-xl text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-zinc-300 dark:border-white/10 transition-all">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-white/5">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button type="button" onClick={() => set('active', !form.active)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? 'bg-primary' : 'bg-zinc-200 dark:bg-white/10'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm font-medium text-zinc-700 dark:text-slate-300">
              {form.active ? 'Đang hiển thị' : 'Đang ẩn'}
            </span>
          </label>

          <div className="flex items-center gap-2">
            {form.active && (
              <button onClick={deactivate} disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-zinc-300 dark:border-white/10 hover:border-rose-200 transition-all">
                <PinOff className="w-3.5 h-3.5" /> Tắt banner
              </button>
            )}
            <button onClick={save} disabled={!form.message.trim() || isPending}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${
                saved ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:opacity-90 shadow-sm shadow-primary/20'
              }`}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCheck className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              {saved ? 'Đã lưu' : 'Lưu & áp dụng'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Preview ── */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-white/[0.02] border border-zinc-300 dark:border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-zinc-500" />
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Xem trước</p>
          </div>

          {/* Browser chrome mockup */}
          <div className="border border-zinc-300 dark:border-white/10 rounded-xl overflow-hidden">
            {/* Browser bar */}
            <div className="bg-zinc-100 dark:bg-white/5 px-3 py-2 flex items-center gap-2 border-b border-zinc-300 dark:border-white/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 bg-white dark:bg-white/10 rounded-md px-3 py-1 text-[10px] text-zinc-500">
                yoursite.com
              </div>
            </div>

            {/* Banner preview */}
            {form.message ? (
              <div className={`${cfg.bg} ${cfg.text} px-4 py-2.5 flex items-center gap-3`}>
                <Icon className="w-4 h-4 shrink-0 opacity-90" />
                <p className="flex-1 text-xs font-medium">
                  <span className="font-bold">{cfg.label}:</span> {form.message}
                </p>
                <X className="w-3.5 h-3.5 opacity-50 shrink-0" />
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-white/5 px-4 py-3 flex items-center justify-center">
                <p className="text-[11px] text-zinc-500 italic">Nhập nội dung để xem trước banner...</p>
              </div>
            )}

            {/* Page mockup */}
            <div className="p-4 space-y-2 bg-white dark:bg-slate-900">
              <div className="h-3 bg-zinc-100 dark:bg-white/10 rounded w-2/3" />
              <div className="h-2 bg-zinc-50 dark:bg-white/5 rounded w-full" />
              <div className="h-2 bg-zinc-50 dark:bg-white/5 rounded w-4/5" />
            </div>
          </div>
        </div>

        {/* Status info */}
        <div className="bg-white dark:bg-white/[0.02] border border-zinc-300 dark:border-white/10 rounded-2xl p-6 space-y-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Trạng thái</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Hiển thị</span>
              <span className={`font-semibold ${form.active ? 'text-emerald-500' : 'text-zinc-500'}`}>
                {form.active ? 'Đang bật' : 'Đang tắt'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Loại</span>
              <span className="font-semibold text-zinc-700 dark:text-slate-300">{cfg.label}</span>
            </div>
            {form.expiresAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Hết hạn</span>
                <span className="font-semibold text-zinc-700 dark:text-slate-300">
                  {new Date(form.expiresAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
