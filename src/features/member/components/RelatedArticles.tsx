'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, Heart, Clock, Sparkles, ArrowRight } from 'lucide-react';
import type { ArticleCard } from '@/features/articles/actions/article';

function formatViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function ArticleGridCard({ article, isLarge }: { article: ArticleCard; isLarge?: boolean }) {
  return (
    <Link href={`/article/${article.slug}`} className="block group h-full">
      <div className="relative h-full flex flex-col overflow-hidden bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl hover:border-primary/30 dark:hover:border-primary/20 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 group">
        <div 
          className={`w-full bg-cover bg-center relative transition-transform duration-700 group-hover:scale-105 ${isLarge ? "aspect-[3/1]" : "aspect-[16/10]"}`}
          style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
        >
          {!article.thumbnail && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-3xl font-bold text-slate-300 dark:text-white/10">
              {article.title[0]}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full border border-white/20 shadow-sm transition-transform duration-300 group-hover:scale-95">
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              Kiến thức
            </span>
          </div>
        </div>
        
        <div className="p-4 flex flex-col flex-1">
          <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-300 mb-2 line-clamp-2 leading-snug">
            {article.title}
          </h4>
          
          <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2 mb-4 flex-1">
            {article.summary || "Khám phá chiều sâu của kiến thức thông qua bài viết này..."}
          </p>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span className="text-[10px] font-semibold">{formatViews(article.viewCount)}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-semibold">{article.readTime}p</span>
              </span>
            </div>
            
            <div className="flex items-center gap-1 font-bold text-[10px] text-primary uppercase tracking-wider group/link">
              Đọc tiếp <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function RelatedArticles({ articles }: { articles: ArticleCard[] }) {
  if (!articles || articles.length === 0) return null;

  // Show up to 7 articles (Row 1: 3 items, Row 2: 4 items)
  const displayArticles = articles.slice(0, 7);

  return (
    <div className="mt-16 sm:mt-24 pt-12 border-t border-slate-100 dark:border-white/5">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white uppercase tracking-wider">
            Bài viết liên quan
          </h3>
        </div>
        <Link 
          href="/article" 
          className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1.5"
        >
          Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayArticles.map((article, index) => (
          <div 
            key={article.id} 
            className={index === 0 ? "sm:col-span-2 lg:col-span-2" : "col-span-1"}
          >
            <ArticleGridCard article={article} isLarge={index === 0} />
          </div>
        ))}
      </div>
    </div>
  );
}
