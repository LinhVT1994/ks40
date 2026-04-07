'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { loginAction } from '@/features/auth/actions/login';
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
    const email = formData.get('email') as string;
    const remember = formData.get('remember') === 'on';

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.success) {
        if (remember) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }
        router.refresh();
        router.push(callbackUrl || '/');
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
        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300" htmlFor="email">Email</label>
        <input
          className="w-full bg-white/50 dark:bg-black/30 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
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
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">Mật khẩu</label>
          <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">Quên mật khẩu?</Link>
        </div>
        <div className="relative">
          <input
            className="w-full bg-white/50 dark:bg-black/30 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 group/check px-0.5">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id="remember"
            name="remember"
            defaultChecked
            className="peer w-4 h-4 appearance-none rounded border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-black/30 checked:bg-primary checked:border-primary transition-all cursor-pointer"
          />
          <svg className="absolute w-2.5 h-2.5 pointer-events-none hidden peer-checked:block left-0.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <label htmlFor="remember" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer select-none">
          Ghi nhớ đăng nhập
        </label>
      </div>

      <button
        className="w-full bg-gradient-to-r from-primary to-accent-purple text-white font-medium rounded-lg px-4 py-2.5 text-sm hover:opacity-90 transition-opacity mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        type="submit"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  );
}
