'use client';

import { Tag, Calendar, User, Clock } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/components/shared/Avatar';
import type { ArticleFull } from '@/features/articles/actions/article';

const CATEGORY_LABELS: Record<string, string> = {
  SYSTEM_DESIGN: 'System Design',
  AI_ML:         'AI / ML',
  DEVOPS:        'DevOps',
  BLOCKCHAIN:    'Blockchain',
  FRONTEND:      'Frontend',
  BACKEND:       'Backend',
  OTHER:         'Khác',
};

export default function ArticleHero({ article }: { article: ArticleFull }) {
  const date = article.publishedAt
    ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(article.publishedAt))
    : '';

  return (
    <div className="w-full relative overflow-visible mb-12">
      <div className="flex flex-col gap-6">
        <div className="flex">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
            <Tag className="w-3 h-3" />
            {CATEGORY_LABELS[article.category] ?? article.category}
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white font-display leading-[1.15] max-w-4xl">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-slate-500 dark:text-slate-400 text-sm border-y border-slate-100 dark:border-white/5 py-4">
          <Link href={`/profile/${article.authorId}`} className="flex items-center gap-2 hover:text-primary transition-colors group/author">
            <Avatar src={article.author.image} name={article.author.name} size={32} />
            <span className="font-semibold text-slate-900 dark:text-white group-hover/author:text-primary transition-colors">{article.author.name}</span>
          </Link>

          {date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{date}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{article.readTime} phút đọc</span>
          </div>
        </div>

        {article.cover && (
          <div className="w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl relative group mt-4">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{ backgroundImage: `url('${article.cover}')`, backgroundPosition: article.coverPosition ?? '50% 50%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}
