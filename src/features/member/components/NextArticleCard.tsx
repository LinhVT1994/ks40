'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, Heart } from 'lucide-react';

type NextArticle = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  thumbnail: string | null;
  cover: string | null;
  category: string;
  readTime: number;
  author: { name: string; image: string | null };
  _count: { likes: number };
};

const CATEGORY_LABELS: Record<string, string> = {
  SYSTEM_DESIGN: 'System Design', AI_ML: 'AI / ML', DEVOPS: 'DevOps',
  BLOCKCHAIN: 'Blockchain', FRONTEND: 'Frontend', BACKEND: 'Backend', OTHER: 'Khác',
};

export default function NextArticleCard({ article }: { article: NextArticle }) {
  const image = article.thumbnail ?? article.cover;

  return (
    <div className="mt-16 mb-8">
      <p className="text-xs font-black text-zinc-500 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-white/5" />
        Bài tiếp theo nên đọc
        <span className="h-px flex-1 bg-zinc-200 dark:bg-white/5" />
      </p>

      <Link
        href={`/article/${article.slug}`}
        className="group relative flex flex-col sm:flex-row gap-0 rounded-[2rem] overflow-hidden border border-zinc-300 dark:border-white/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 active:scale-[0.99] bg-white dark:bg-slate-900"
      >
        {/* Image */}
        {image ? (
          <div className="relative sm:w-72 h-48 sm:h-auto shrink-0 overflow-hidden">
            <Image
              src={image}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, 288px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 dark:to-black/10" />
          </div>
        ) : (
          <div className="sm:w-72 h-48 sm:h-auto shrink-0 bg-gradient-to-br from-primary/10 to-accent-purple/10 flex items-center justify-center">
            <ArrowRight className="w-10 h-10 text-primary/20" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
              {CATEGORY_LABELS[article.category] ?? article.category}
            </span>
            <h3 className="font-display font-black text-xl sm:text-2xl text-zinc-800 dark:text-white leading-snug group-hover:text-primary transition-colors duration-300 mb-2">
              {article.title}
            </h3>
            {article.summary && (
              <p className="text-sm text-zinc-500 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {article.readTime} phút
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" /> {article.author.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              Đọc ngay <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
