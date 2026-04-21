'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Heart, Clock, ArrowRight } from 'lucide-react';
import { GlanceTrigger } from '@/features/member/components/GlancePreview';
import { ProfileArticle } from './ProfileArticleCard';
import { cn } from '@/lib/utils';

interface FeaturedArticleCardProps {
  article: ProfileArticle;
}

const fmtViews = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  return (
    <GlanceTrigger article={article as any}>
      <Link
        href={`/article/${article.slug}`}
        className="group relative block w-full bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-700"
      >
        <div className="flex flex-col lg:flex-row h-full">
          {/* Large Image Showcase */}
          <div className="lg:w-[55%] relative aspect-[16/10] lg:aspect-auto overflow-hidden">
            <Image
              src={article.thumbnail || '/placeholder-article.jpg'}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              alt={article.title}
            />
            {/* Featured Badge */}
            <div className="absolute top-6 left-6">
               <div className="bg-primary/90 backdrop-blur-md text-white text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full tracking-[0.2em] uppercase shadow-lg">
                  Nổi bật
               </div>
            </div>
            
            {/* Visual Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 lg:hidden" />
          </div>

          {/* Content Details */}
          <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-[2px] bg-primary rounded-full" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                   {article.topic.label}
                </span>
            </div>

            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-800 dark:text-white leading-[1.2] mb-4 group-hover:text-primary transition-colors duration-500">
               {article.title}
            </h3>

            {article.summary && (
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-slate-400 line-clamp-2 mb-6 leading-relaxed font-medium">
                {article.summary}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-8 text-zinc-500">
               <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold tabular-nums">{fmtViews(article._count.likes)}</span>
               </div>
               <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold tabular-nums">{fmtViews(article.viewCount)}</span>
               </div>
               <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-bold tabular-nums">{article.readTime} phút</span>
               </div>
            </div>

            <div className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base group-hover:translate-x-2 transition-transform duration-500">
               Đọc bài viết ngay <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Decorative Element */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      </Link>
    </GlanceTrigger>
  );
}
