'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, PenLine, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function WelcomeSection({ name }: { name?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string })?.role;
  const canWrite = (session?.user as { canWrite?: boolean })?.canWrite || role === 'ADMIN';

  const [today, setToday] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setToday(new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date()));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 pt-20 pb-16 animate-welcome-fade-up">
      {/* Date Badge */}
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/20 shadow-sm shadow-primary/5 group transition-all hover:bg-primary/10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="p-1.5 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300">
          <Calendar className="w-3 h-3 text-primary" />
        </div>
        <span className="text-[11px] font-bold text-primary dark:text-primary-foreground uppercase tracking-[0.15em]">
          {today}
        </span>
      </div>

      {/* Main Heading */}
      <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-zinc-800 dark:text-white leading-tight font-display mt-4">
        Xin chào <span className="animate-wave inline-block">👋</span>
        {name ? (
          <span className="dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-indigo-500 dark:via-primary dark:to-purple-600 dark:animate-text-shimmer">
            , {name}!
          </span>
        ) : '!'}
      </h1>

      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto px-4 mt-6">
        <p className="text-zinc-500 dark:text-slate-400 max-w-2xl text-[10px] sm:text-[11px] font-bold opacity-60 uppercase tracking-[0.2em]">
          Hôm nay bạn muốn học thêm kiến thức gì mới?
        </p>

        {/* Hero Search Bar */}
        <form onSubmit={handleSearch} className="w-full flex justify-center relative z-20">
          <motion.div 
            initial={false}
            animate={{ 
              width: (isFocused || searchQuery) ? '480px' : '320px',
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative group w-full"
          >
            <div className={`relative flex items-center bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-full transition-all duration-300 ${
              isFocused || searchQuery ? 'ring-2 ring-primary/20 border-primary/30 shadow-2xl shadow-primary/10 bg-white dark:bg-zinc-900/40 scale-105' : 'hover:bg-zinc-200/50 dark:hover:bg-white/10'
            }`}>
              <div className={`absolute left-4 pointer-events-none transition-colors duration-300 ${isFocused || searchQuery ? 'text-primary' : 'text-zinc-400'}`}>
                <Search className="w-4 h-4" />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isFocused || searchQuery ? "Nhập từ khóa tìm kiếm... (Enter)" : "Tìm kiến thức..."}
                className="w-full h-10 bg-transparent pl-12 pr-10 text-sm outline-none text-zinc-800 dark:text-white placeholder:text-zinc-500 transition-all"
              />

              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
                  className="absolute right-3 p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <AnimatePresence>
              {searchQuery && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-3 text-center"
                >
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">
                    Nhấn Enter để tìm kiếm tri thức
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
