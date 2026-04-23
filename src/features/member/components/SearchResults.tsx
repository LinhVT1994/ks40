'use client';

import React from 'react';
import { Search } from 'lucide-react';
import type { ArticleCard } from '@/features/articles/actions/article';
import ArticleListItem from '@/features/articles/components/ArticleListItem';

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
    <div className="flex flex-col">
      {articles.map((article, idx) => (
        <React.Fragment key={article.id}>
          <ArticleListItem 
            article={article}
            highlight={(text) => highlight(text, query)}
          />
          {idx < articles.length - 1 && (
             <div className="h-px bg-zinc-100 dark:bg-white/5 w-full my-2 sm:my-3 lg:my-4" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
