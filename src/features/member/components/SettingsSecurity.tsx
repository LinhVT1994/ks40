'use client';

import { useState } from 'react';
import { Key, Loader2, CheckCircle2 } from 'lucide-react';

export default function SettingsSecurity() {
  const [isPending, setIsPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-10">
      {/* Đổi mật khẩu */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-800 dark:text-white">Đổi mật khẩu</h3>
            <p className="text-xs text-zinc-500 mt-1">Cập nhật mật khẩu để bảo vệ tài khoản tốt hơn.</p>
          </div>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-slate-300">Mật khẩu hiện tại</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all dark:text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-slate-300">Mật khẩu mới</label>
            <input 
              type="password" 
              placeholder="Ít nhất 8 ký tự"
              className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all dark:text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-slate-300">Xác nhận mật khẩu mới</label>
            <input 
              type="password" 
              placeholder="Nhập lại mật khẩu mới"
              className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all dark:text-white"
            />
          </div>
          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-800 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-zinc-800/20 dark:shadow-white/10"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cập nhật mật khẩu'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Đã cập nhật
              </span>
            )}
          </div>
        </form>
      </section>

    </div>
  );
}
