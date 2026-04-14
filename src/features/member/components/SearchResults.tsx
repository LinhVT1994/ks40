'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Clock, Eye, Tag, Search, Lock, Star } from 'lucide-react';
import type { ArticleCard } from '@/features/articles/actions/article';


const BADGE_LABELS: Record<string, string> = {
  HOT: 'Hot', NEW: 'New', TRENDING: 'Trending', FEATURED: 'Featured',
};

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

function formatViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function formatDate(date: Date | null) {
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

export default function SearchResults({ articles, query, tag }: { articles: ArticleCard[]; query: string; tag?: string }) {
  if (!query && !tag) {
    return (
      <div className="py-24 text-center">
        <Search className="w-12 h-12 mx-auto mb-4 text-zinc-200 dark:text-white/10" />
        <p className="text-zinc-500">Nhập từ khóa vào ô tìm kiếm phía trên để bắt đầu.</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="py-24 text-center">
        <Search className="w-12 h-12 mx-auto mb-4 text-zinc-200 dark:text-white/10" />
        <p className="font-semibold text-zinc-700 dark:text-slate-200 mb-2">Không tìm thấy kết quả</p>
        <p className="text-sm text-zinc-500">Thử tìm với từ khóa khác hoặc kiểm tra lại chính tả.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-200 dark:divide-white/5">
      {articles.map(article => (
        <Link key={article.id} href={`/article/${article.slug}`} className="block group py-4 sm:py-5 first:pt-0">
          {/* Top row: Thumbnail + Title/Stats */}
          <div className="flex gap-3 sm:gap-4 items-start">
            {/* Thumbnail + Badges overlay */}
            <div
              className="relative w-20 h-16 sm:w-28 sm:h-20 rounded-lg sm:rounded-xl shrink-0 bg-zinc-100 dark:bg-white/5 bg-cover bg-center flex items-center justify-center text-zinc-300 dark:text-white/20 font-bold text-lg sm:text-xl overflow-hidden"
              style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
            >
              {!article.thumbnail && article.title[0]}
              {/* Article badges (Hot/New/Trending/Featured) inside thumbnail */}
              {article.badges.length > 0 && (
                <div className="absolute top-1 left-1 flex flex-wrap gap-0.5">
                  {article.badges.map(b => (
                    <span key={b} className="px-1.5 py-px rounded bg-black/60 text-white text-[8px] sm:text-[9px] font-bold uppercase leading-none backdrop-blur-sm">
                      {BADGE_LABELS[b] ?? b}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors font-display leading-snug mb-1">
                {highlight(article.title, query)}
              </h2>

              {/* Audience + Topic badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                {article.audience === 'PREMIUM' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-500/20">
                    <Star className="w-2.5 h-2.5 fill-current" /> Premium
                  </span>
                )}
                {article.audience === 'MEMBERS' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-500/20">
                    <Lock className="w-2.5 h-2.5" /> Members
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-zinc-300 dark:border-white/5">
                  <Tag className="w-2.5 h-2.5" />
                  {article.topic.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-500 text-[11px] sm:text-xs">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{article._count.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{article._count.comments}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{formatViews(article.viewCount)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{article.readTime}p
                </span>
                {article.publishedAt && (
                  <span className="hidden sm:inline ml-auto text-[11px]">{formatDate(article.publishedAt)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Description — full width below */}
          {article.summary && (
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-slate-300 line-clamp-2 leading-relaxed mt-2">
              {highlight(article.summary, query)}
            </p>
          )}

        </Link>
      ))}
    </div>
  );
}
