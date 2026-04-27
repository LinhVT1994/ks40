'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';
import { forgotPasswordAction } from '@/features/auth/actions/forgot-password';

export default function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await forgotPasswordAction(formData);
      if (result.success) {
        setSubmittedEmail(email);
      } else {
        setError(result.error);
      }
    });
  };

  if (submittedEmail) {
    return (
      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
          <span className="material-icons text-4xl">mark_email_read</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-zinc-900 dark:text-white font-display">Kiểm tra hộp thư</h3>
          <p className="text-sm text-zinc-500 dark:text-slate-500 font-medium">
            Chúng tôi đã gửi một liên kết khôi phục mật khẩu đến <br />
            <span className="font-black text-zinc-900 dark:text-white">{submittedEmail}</span>
          </p>
        </div>
        <div className="pt-6">
          <button onClick={() => setSubmittedEmail('')} className="text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
            Thử lại với email khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-zinc-500 dark:text-slate-500 px-1" htmlFor="email">Địa chỉ Email</label>
        <p className="text-[11px] font-medium text-zinc-400 dark:text-slate-500 mb-4 px-1 leading-relaxed">
          Nhập địa chỉ email liên kết với tài khoản của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
        </p>
        <input
          className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-medium"
          id="email"
          name="email"
          placeholder="example@gmail.com"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      <button
        className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-xl px-4 py-4 text-sm hover:opacity-90 active:scale-[0.98] transition-all mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xl shadow-zinc-200 dark:shadow-none"
        type="submit"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isPending ? 'Đang khởi tạo...' : 'Gửi liên kết khôi phục'}
      </button>

      <div className="mt-8 text-center">
        <Link href="/login" className="inline-flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
        </Link>
      </div>
    </form>
  );
}
