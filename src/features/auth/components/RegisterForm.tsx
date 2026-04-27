'use client';

import React, { Suspense, useState, useTransition } from 'react';
import { motion } from 'framer-motion';
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
        <div className="relative flex items-center justify-center py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-100 dark:border-white/5" />
          </div>
          <span className="relative px-4 bg-white/70 dark:bg-black/30 text-[10px] font-black text-zinc-400 uppercase tracking-widest rounded-full backdrop-blur-md">
            Hoặc tiếp tục với Email
          </span>
        </div>
        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2 text-zinc-500 dark:text-slate-500 px-1" htmlFor="step1-email">Địa chỉ Email</label>
            <input
              className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-medium"
              id="step1-email"
              placeholder="example@gmail.com"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <button className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-xl px-4 py-4 text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-zinc-200 dark:shadow-none" type="submit">
              Tiếp tục <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-primary transition-colors mb-6 group/back">
        <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" /> Quay lại bước trước
      </button>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-zinc-500 dark:text-slate-500 px-1">Email</label>
        <input className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-400 dark:text-slate-500 cursor-not-allowed outline-none font-medium" type="email" value={email} disabled />
      </div>

      <div>
        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-zinc-500 dark:text-slate-500 px-1" htmlFor="username">Username</label>
        <input className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-medium" id="username" name="username" placeholder="john_doe" type="text" required disabled={isPending} />
        <p className="mt-1.5 px-1 text-[10px] text-zinc-400 dark:text-slate-500 font-medium italic">Sử dụng chữ cái, số, dấu chấm hoặc gạch dưới. Đây sẽ là định danh hồ sơ của bạn.</p>
      </div>

      <div>
        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-zinc-500 dark:text-slate-500 px-1" htmlFor="name">Tên hiển thị</label>
        <input className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-medium" id="name" name="name" placeholder="Ví dụ: Anh Quân" type="text" required disabled={isPending} />
      </div>

      <div>
        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-zinc-500 dark:text-slate-500 px-1" htmlFor="password">Mật khẩu</label>
        <div className="relative">
          <input className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-medium" id="password" name="password" placeholder="••••••••" type={showPassword ? 'text' : 'password'} required disabled={isPending} />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary transition-colors p-1">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-zinc-500 dark:text-slate-500 px-1" htmlFor="confirm">Xác nhận mật khẩu</label>
        <input className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-medium" id="confirm" name="confirm" placeholder="••••••••" type="password" required disabled={isPending} />
      </div>

      <motion.div
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 20px 40px rgba(59, 130, 246, 0.1), 0 0 20px rgba(59, 130, 246, 0.05)"
        }}
        whileTap={{ scale: 0.98 }}
        className="relative group/btn w-full mt-6"
      >
        <button
          className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-xl px-4 py-4 text-base transition-all flex items-center justify-center gap-2 overflow-hidden relative"
          type="submit"
          disabled={isPending}
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-primary/5 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite] transition-transform pointer-events-none" />
          
          <span className="relative z-10">{isPending ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}</span>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin relative z-10" /> : <ArrowRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />}
        </button>
        
        {/* External glow */}
        <div className="absolute -inset-1 bg-primary/10 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 rounded-3xl -z-10" />
      </motion.div>

      <p className="mt-6 text-center text-xs text-zinc-500 dark:text-slate-400 leading-relaxed">
        Bằng cách đăng ký, bạn đồng ý với <Link href="/terms" className="text-primary hover:underline">Điều khoản Dịch vụ</Link> và <Link href="/privacy" className="text-primary hover:underline">Chính sách Bảo mật</Link> của Lenote.
      </p>
    </form>
  );
}
