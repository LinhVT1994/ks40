'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';

type NavArticle = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  thumbnail: string | null;
  author: { name: string };
};

type Props = {
  prev: NavArticle | null;
  next: NavArticle | null;
};

export default function ArticleNavigation({ prev, next }: Props) {
  if (!prev && !next) return null;

  return (
    <div className="mt-16 mb-12 flex flex-col gap-8">
      {/* Next Article - Immersive Hero */}
      {next && (
        <div className="relative group">
          <Link 
            href={`/article/${next.slug}`}
            className="block relative w-full h-64 sm:h-80 overflow-hidden rounded-[2.5rem] border border-zinc-200 dark:border-white/5 transition-all duration-700 hover:shadow-2xl hover:shadow-primary/20 active:scale-[0.99]"
          >
            {/* Background Image with Parallax-like scale */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={next.thumbnail ? { backgroundImage: `url('${next.thumbnail}')` } : undefined}
            />
            {/* Dark & Glassy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-800 via-zinc-800/40 to-transparent" />
            <div className="absolute inset-0 bg-zinc-800/20 backdrop-blur-[1px] group-hover:backdrop-blur-0 transition-all duration-700" />
            
            <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-primary/30">
                  Bài tiếp theo
                </span>
                <div className="h-px w-12 bg-white/20" />
              </div>
              
              <div className="max-w-2xl">
                <h3 className="font-display font-black text-2xl sm:text-4xl text-white mb-4 leading-tight group-hover:translate-x-1 transition-transform duration-500">
                  {next.title}
                </h3>
                {next.summary && (
                  <p className="text-white/70 text-sm sm:text-base line-clamp-2 font-medium mb-2 hidden xs:block">
                    {next.summary}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-white font-bold text-sm mt-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                <span>Đọc ngay bài bản</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Floating Arrow Badge */}
            <div className="absolute top-8 right-8 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-all duration-500 group-hover:bg-primary group-hover:border-primary group-hover:scale-110">
              <ChevronRight className="w-6 h-6" />
            </div>
          </Link>
        </div>
      )}

      {/* Previous Article - Subtle Link */}
      {prev && (
        <div className="flex justify-center md:justify-start">
          <Link 
            href={`/article/${prev.slug}`}
            className="group flex items-center gap-4 px-6 py-4 rounded-full border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 backdrop-blur-md hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none transition-all duration-500 active:scale-95"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-200 dark:bg-white/10 group-hover:bg-primary group-hover:text-white transition-all duration-500">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-zinc-500 dark:text-slate-500 min-w-0 uppercase tracking-[0.2em] leading-none mb-1">
                Quay lại bài trước
              </span>
              <span className="text-sm font-bold text-zinc-700 dark:text-slate-300 group-hover:text-primary transition-colors line-clamp-1 max-w-[200px] sm:max-w-sm">
                {prev.title}
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
