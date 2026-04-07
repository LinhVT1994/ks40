'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Clock, Eye, Tag, Search, Lock, Star } from 'lucide-react';
import type { ArticleCard } from '@/features/articles/actions/article';

const CATEGORY_LABELS: Record<string, string> = {
  SYSTEM_DESIGN: 'System Design', AI_ML: 'AI/ML', DEVOPS: 'DevOps',
  BLOCKCHAIN: 'Blockchain', FRONTEND: 'Frontend', BACKEND: 'Backend', OTHER: 'Khác',
};

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
        <Search className="w-12 h-12 mx-auto mb-4 text-slate-200 dark:text-white/10" />
        <p className="text-slate-400">Nhập từ khóa vào ô tìm kiếm phía trên để bắt đầu.</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="py-24 text-center">
        <Search className="w-12 h-12 mx-auto mb-4 text-slate-200 dark:text-white/10" />
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Không tìm thấy kết quả</p>
        <p className="text-sm text-slate-400">Thử tìm với từ khóa khác hoặc kiểm tra lại chính tả.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
      {articles.map(article => (
        <Link key={article.id} href={`/article/${article.slug}`} className="block group py-5 first:pt-0">
          <div className="flex gap-4 items-start">
            {/* Thumbnail */}
            <div
              className="w-28 h-20 rounded-xl shrink-0 bg-slate-100 dark:bg-white/5 bg-cover bg-center flex items-center justify-center text-slate-300 dark:text-white/20 font-bold text-xl overflow-hidden"
              style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
            >
              {!article.thumbnail && article.title[0]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors font-display leading-snug flex-1">
                  {highlight(article.title, query)}
                </h2>
                <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
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
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-white/5">
                    <Tag className="w-2.5 h-2.5" />
                    {CATEGORY_LABELS[article.category]}
                  </span>
                </div>
              </div>

              {article.summary && (
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                  {highlight(article.summary, query)}
                </p>
              )}

              <div className="flex items-center gap-4 text-slate-400 text-xs">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />{article._count.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />{article._count.comments}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />{formatViews(article.viewCount)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />{article.readTime} phút
                </span>
                {article.publishedAt && (
                  <span className="ml-auto text-[11px]">{formatDate(article.publishedAt)}</span>
                )}
              </div>

              {article.badges.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {article.badges.map(b => (
                    <span key={b} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {BADGE_LABELS[b] ?? b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
