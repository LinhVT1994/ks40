'use client';

import React, { Suspense, useState, useTransition } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import SocialLogin from './SocialLogin';
import { registerAction } from '@/features/auth/actions/register';

export default function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setStep(2);
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    formData.set('email', email);

    startTransition(async () => {
      const result = await registerAction(formData);
      if (result.success) {
        window.location.href = '/onboarding';
      } else {
        setError(result.error);
      }
    });
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <Suspense><SocialLogin /></Suspense>
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <span className="relative px-4 bg-background-light dark:bg-black/30 text-xs font-bold text-slate-500 uppercase tracking-widest rounded-full">
            Hoặc tiếp tục với Email
          </span>
        </div>
        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300" htmlFor="step1-email">Địa chỉ Email</label>
            <input
              className="w-full bg-white/50 dark:bg-black/30 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              id="step1-email"
              placeholder="example@gmail.com"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <button className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-lg px-4 py-3 text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group" type="submit">
            Tiếp tục <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Email</label>
        <input className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed outline-none" type="email" value={email} disabled />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300" htmlFor="name">Họ và tên</label>
        <input className="w-full bg-white/50 dark:bg-black/30 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none" id="name" name="name" placeholder="Nguyễn Văn A" type="text" required disabled={isPending} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300" htmlFor="password">Mật khẩu</label>
        <div className="relative">
          <input className="w-full bg-white/50 dark:bg-black/30 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none" id="password" name="password" placeholder="••••••••" type={showPassword ? 'text' : 'password'} required disabled={isPending} />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300" htmlFor="confirm">Xác nhận mật khẩu</label>
        <input className="w-full bg-white/50 dark:bg-black/30 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none" id="confirm" name="confirm" placeholder="••••••••" type="password" required disabled={isPending} />
      </div>

      <button
        className="w-full bg-gradient-to-r from-primary to-accent-purple text-white font-medium rounded-lg px-4 py-3 text-sm hover:opacity-90 transition-opacity mt-6 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
        type="submit"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isPending ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
      </button>

      <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        Bằng cách đăng ký, bạn đồng ý với <Link href="/terms" className="text-primary hover:underline">Điều khoản Dịch vụ</Link> và <Link href="/privacy" className="text-primary hover:underline">Chính sách Bảo mật</Link> của Lenote.dev.
      </p>
    </form>
  );
}
