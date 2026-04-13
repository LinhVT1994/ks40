'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { resetPasswordAction } from '@/features/auth/actions/reset-password';

function ResetPasswordFormInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-rose-500 text-sm">Link không hợp lệ hoặc đã hết hạn.</p>
        <Link href="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
          Yêu cầu link mới
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>
        <p className="font-semibold text-zinc-800 dark:text-white">Đặt lại mật khẩu thành công!</p>
        <p className="text-sm text-zinc-500">Bạn có thể đăng nhập với mật khẩu mới ngay bây giờ.</p>
        <Link
          href="/login"
          className="inline-block w-full bg-gradient-to-r from-primary to-accent-purple text-white font-medium rounded-lg px-4 py-2.5 text-sm text-center hover:opacity-90 transition-opacity mt-2"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    formData.set('token', token);

    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-slate-300" htmlFor="password">
          Mật khẩu mới
        </label>
        <div className="relative">
          <input
            className="w-full bg-white/50 dark:bg-black/30 border border-zinc-300 dark:border-slate-700 rounded-lg px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Tối thiểu 8 ký tự"
            required
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-slate-300" htmlFor="confirm">
          Xác nhận mật khẩu
        </label>
        <input
          className="w-full bg-white/50 dark:bg-black/30 border border-zinc-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
          id="confirm"
          name="confirm"
          type="password"
          placeholder="••••••••"
          required
          disabled={isPending}
        />
      </div>

      <button
        className="w-full bg-gradient-to-r from-primary to-accent-purple text-white font-medium rounded-lg px-4 py-2.5 text-sm hover:opacity-90 transition-opacity mt-6 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        type="submit"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
      </button>
    </form>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-zinc-500">Đang tải...</div>}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
