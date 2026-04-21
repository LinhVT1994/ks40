'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Heart, Clock, Sparkles, ArrowRight } from 'lucide-react';
import type { ArticleCard } from '@/features/articles/actions/article';
import { GlanceTrigger } from '@/features/member/components/GlancePreview';
import { cn } from '@/lib/utils';

function formatViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function ArticleGridCard({ article, isLarge }: { article: ArticleCard; isLarge?: boolean }) {
  return (
    <GlanceTrigger article={article} className="h-full">
      <div className="relative group h-full">
        {/* Absolute Cover Link for the article */}
        <Link 
          href={`/article/${article.slug}`} 
          className="absolute inset-0 z-20 cursor-pointer" 
          aria-label={article.title}
        />
        
        <div className="relative z-10 h-full flex flex-col overflow-hidden bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl group-hover:border-primary/30 dark:group-hover:border-primary/20 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-primary/5">
          <div className={`w-full relative overflow-hidden ${isLarge ? "aspect-[22/10]" : "aspect-[16/10]"}`}>
            {article.thumbnail ? (
              <Image
                src={article.thumbnail}
                alt={article.title}
                fill
                sizes={isLarge ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ objectPosition: article.thumbnailPosition ?? '50% 50%' }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-white/5 text-3xl font-bold text-zinc-300 dark:text-white/10">
                {article.title[0]}
              </div>
            )}
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-zinc-800/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
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
            {/* Author Info */}
            <div className="flex items-center mb-2 opacity-80 group-hover:opacity-100 transition-opacity relative z-30">
              <Link 
                href={`/profile/${article.author.username || article.author.id}`}
                className="text-[10px] font-semibold text-zinc-500 dark:text-slate-400 hover:text-primary transition-colors"
              >
                <span className="font-normal opacity-70">bởi</span> {article.author?.name}
              </Link>
            </div>

            <h4 className="font-display font-bold text-sm sm:text-base text-zinc-800 dark:text-white group-hover:text-primary transition-colors duration-300 mb-2 line-clamp-2 leading-snug">
              {article.title}
            </h4>
            
            <p className="text-zinc-500 dark:text-slate-300 text-sm line-clamp-2 mb-4 flex-1">
              {article.summary || "Khám phá chiều sâu của kiến thức thông qua bài viết này..."}
            </p>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-200 dark:border-white/5">
              <div className="flex items-center gap-3 text-zinc-500">
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
      </div>
    </GlanceTrigger>
  );
}

export default function RelatedArticles({ articles }: { articles: ArticleCard[] }) {
  if (!articles || articles.length === 0) return null;

  const displayArticles = articles.slice(0, 6);
  const count = displayArticles.length;

  return (
    <div className="mt-16 sm:mt-24 pt-12 border-t border-zinc-200 dark:border-white/5">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-display font-bold text-base sm:text-lg text-zinc-800 dark:text-white uppercase tracking-wider">
            Bài viết liên quan
          </h3>
        </div>
        <Link 
          href="/article" 
          className="text-[10px] font-bold text-zinc-500 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1.5"
        >
          Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayArticles.map((article, index) => {
          // Dynamic span logic requested by user
          let spanClass = "col-span-1";
          let isLarge = false;

          if (count === 1) {
            spanClass = "lg:col-span-2";
            isLarge = true;
          } else if (count === 2) {
            if (index === 0) {
              spanClass = "lg:col-span-2";
              isLarge = true;
            } else {
              spanClass = "lg:col-span-1";
            }
          } else {
            spanClass = "lg:col-span-1";
          }

          return (
            <div 
              key={article.id} 
              className={cn(
                "animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both",
                spanClass
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ArticleGridCard article={article} isLarge={isLarge} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
