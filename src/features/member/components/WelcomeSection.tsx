'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, PenLine } from 'lucide-react';

export default function WelcomeSection({ name }: { name?: string }) {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const canWrite = (session?.user as { canWrite?: boolean })?.canWrite || role === 'ADMIN';

  const [today, setToday] = useState('');
  useEffect(() => {
    setToday(new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date()));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center gap-5 pt-16 pb-10 animate-welcome-fade-up">
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/20 shadow-sm shadow-primary/5 group transition-all hover:bg-primary/10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="p-1.5 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300">
          <Calendar className="w-3 h-3 text-primary" />
        </div>
        <span className="text-[11px] font-bold text-primary dark:text-primary-foreground uppercase tracking-[0.15em]">
          {today}
        </span>
      </div>
      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-800 dark:text-white leading-tight font-display">
        Xin chào <span className="animate-wave inline-block">👋</span>
        {name ? (
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-primary to-purple-600 animate-text-shimmer">
            , {name}!
          </span>
        ) : '!'}
      </h1>
      <div className="flex flex-col items-center gap-3">
        <p className="text-zinc-500 dark:text-slate-400 max-w-2xl text-xs sm:text-sm font-medium opacity-60 uppercase tracking-widest">
          Hôm nay bạn muốn học thêm kiến thức gì mới?
        </p>
        
        {canWrite && (
          <Link 
            href="/write" 
            className="group relative flex items-center gap-2 px-3.5 py-1.5 mt-1 rounded-full bg-zinc-100/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 animate-in fade-in slide-in-from-top-2 delay-300 overflow-hidden"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -skew-x-[20deg] animate-shimmer-sweep pointer-events-none" />
            
            <div className="flex items-center gap-2 relative z-10">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-slate-400 group-hover:text-primary transition-colors uppercase tracking-wider">
                Chia sẻ ngay
              </span>
              <div className="p-1 bg-white dark:bg-white/10 rounded-md shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <PenLine className="w-3 h-3 text-zinc-500 group-hover:text-primary" />
              </div>
            </div>
          </Link>
        )}
      </div>

    </div>
  );
}
