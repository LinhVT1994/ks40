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
      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-icons text-3xl">mark_email_read</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Kiểm tra hộp thư của bạn</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Chúng tôi đã gửi một liên kết khôi phục mật khẩu đến <br />
          <span className="font-semibold text-slate-900 dark:text-white">{submittedEmail}</span>
        </p>
        <div className="pt-4">
          <button onClick={() => setSubmittedEmail('')} className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
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
        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300" htmlFor="email">Địa chỉ Email</label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Nhập địa chỉ email liên kết với tài khoản của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
        </p>
        <input
          className="w-full bg-white/50 dark:bg-black/30 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
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
        className="w-full bg-gradient-to-r from-primary to-accent-purple text-white font-medium rounded-lg px-4 py-3 text-sm hover:opacity-90 transition-opacity mt-6 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        type="submit"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isPending ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
      </button>

      <div className="mt-6 text-center">
        <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
        </Link>
      </div>
    </form>
  );
}
