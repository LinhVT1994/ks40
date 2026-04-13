'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [initialEmail, setInitialEmail] = useState('');

  React.useEffect(() => {
    const saved = localStorage.getItem('remembered_email');
    if (saved) setInitialEmail(saved);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const email = ((formData.get('email') as string) || '').trim().toLowerCase();
    const password = formData.get('password') as string;
    const remember = formData.get('remember') === 'on';

    startTransition(async () => {
      if (!email || !password) {
        setError('Vui lòng nhập email và mật khẩu.');
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        remember: String(remember),
        redirect: false,
        callbackUrl: callbackUrl || '/',
      });

      if (result?.error) {
        setError('Email hoặc mật khẩu không đúng.');
        return;
      }

      if (result?.ok) {
        if (remember) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }
        router.refresh();
        router.push(result.url || callbackUrl || '/');
        return;
      }

      setError('Tài khoản bị khoá hoặc có lỗi xảy ra.');
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
        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-zinc-500 dark:text-zinc-400 px-1" htmlFor="email">Email</label>
        <input
          className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
          id="email"
          name="email"
          defaultValue={initialEmail}
          key={initialEmail}
          placeholder="developer@ks40.com"
          type="email"
          required
          disabled={isPending}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400" htmlFor="password">Mật khẩu</label>
          <Link href="/forgot-password" alt-target="true" className="text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary/80 transition-colors">Quên mật khẩu?</Link>
        </div>
        <div className="relative">
          <input
            className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
            id="password"
            name="password"
            placeholder="••••••••"
            type={showPassword ? 'text' : 'password'}
            required
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary transition-colors p-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 group/check px-1">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id="remember"
            name="remember"
            defaultChecked
            className="peer w-4 h-4 appearance-none rounded-md border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/30 checked:bg-primary checked:border-primary transition-all cursor-pointer"
          />
          <svg className="absolute w-2.5 h-2.5 pointer-events-none hidden peer-checked:block left-0.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <label htmlFor="remember" className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-primary transition-colors cursor-pointer select-none">
          Ghi nhớ đăng nhập
        </label>
      </div>

      <button
        className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-xl px-4 py-4 text-sm hover:opacity-90 active:scale-[0.98] transition-all mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xl shadow-zinc-200 dark:shadow-none"
        type="submit"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isPending ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
      </button>
    </form>
  );
}
