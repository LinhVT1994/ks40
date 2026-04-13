'use client';

import React from 'react';
import Link from 'next/link';
import { Play, BookOpen, Clock, ChevronRight } from 'lucide-react';

interface ContinueReadingProps {
  lastActivity: any | null;
}

export default function ContinueReading({ lastActivity }: ContinueReadingProps) {
  if (!lastActivity) return null;

  const isArticle = lastActivity.type === 'article';
  const data     = lastActivity.data;
  
  const title    = isArticle ? data.article.title : data.chapter.title;
  const slug     = isArticle ? data.article.slug : data.chapter.slug;
  const bookSlug = !isArticle ? data.chapter.book.slug : '';
  const progress = isArticle ? data.progress : 1; // Simplified for chapters
  const parent   = isArticle ? 'Bài viết' : data.chapter.book.title;
  const href     = isArticle ? `/article/${slug}` : `/books/${bookSlug}/${slug}`;
  const thumbnail = isArticle ? data.article.thumbnail : null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 px-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-700">
      <Link href={href} className="group block relative overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-white/10 dark:border-white/20 p-8 sm:p-10 shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:shadow-primary/30 active:scale-[0.99] group/card">
        
        {/* Abstract Background Design */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/20 via-primary/5 to-transparent blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent-purple/10 blur-[100px] opacity-30" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-10">
          {/* Content Info */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-2.5">
               <div className="p-1.5 bg-primary/20 rounded-lg backdrop-blur-md border border-white/10 text-primary">
                 {isArticle ? <BookOpen className="w-3 h-3" /> : <Play className="w-3 h-3" />}
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 opacity-80">Tiếp tục hành trình</span>
            </div>
            
            <div className="space-y-4">
                <p className="text-[11px] font-bold text-primary/60 uppercase tracking-widest">{parent}</p>
                <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight group-hover:text-primary transition-colors">
                    {title}
                </h2>
            </div>

            <div className="flex items-center gap-8 text-white/50">
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Tiến độ</span>
                 <div className="flex items-center gap-3">
                    <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.6)]" style={{ width: `${Math.round(progress * 100)}%` }} />
                    </div>
                    <span className="text-[11px] font-black text-white">{Math.round(progress * 100)}%</span>
                 </div>
               </div>
               
               {isArticle && data.article.readTime && (
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Thời gian đọc</span>
                    <div className="flex items-center gap-1.5 text-white/80">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11px] font-black">{data.article.readTime} phút</span>
                    </div>
                </div>
               )}
            </div>
          </div>

          {/* Action Area */}
          <div className="shrink-0 flex items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 group-hover:bg-primary group-hover:scale-110 flex items-center justify-center transition-all duration-500 shadow-xl shadow-black/20 group-hover:shadow-primary/40 active:scale-95 group/btn">
                <ChevronRight className="w-8 h-8 text-white transform group-hover:translate-x-1 transition-transform" />
             </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
