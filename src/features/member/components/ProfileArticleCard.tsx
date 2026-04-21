'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Heart, Clock } from 'lucide-react';
import { GlanceTrigger } from '@/features/member/components/GlancePreview';
import { cn } from '@/lib/utils';

export type ProfileArticle = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  thumbnail: string | null;
  thumbnailPosition?: string | null;
  topic: { label: string; color: string | null };
  readTime: number;
  viewCount: number;
  publishedAt?: Date | string | null;
  _count: { likes: number; comments: number };
};

interface ProfileArticleCardProps {
  article: ProfileArticle;
  index?: number;
  className?: string;
  showReadTime?: boolean;
}

const fmtViews = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function ProfileArticleCard({ 
  article, 
  index = 0, 
  className,
  showReadTime = true 
}: ProfileArticleCardProps) {
  return (
    <GlanceTrigger article={article as any}>
      <Link
        href={`/article/${article.slug}`}
        style={{ animationDelay: `${index * 100}ms` }}
        className={cn(
          "group relative block h-full bg-white/40 dark:bg-white/[0.02] backdrop-blur-md max-md:backdrop-blur-sm border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-both",
          className
        )}
      >
        <div className="aspect-[16/10] overflow-hidden relative">
          <Image
            src={article.thumbnail || '/placeholder-article.jpg'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            alt={article.title}
          />
          <div className="absolute top-3 left-3">
            <span
              className="backdrop-blur-md max-md:backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide shadow-sm border border-white/20 dark:border-white/5"
              style={{ color: article.topic.color ?? '#3B82F6' }}
            >
              {article.topic.label}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-sm sm:text-base font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1.5">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-[11px] sm:text-[13px] text-zinc-500 line-clamp-2 mb-4 leading-relaxed font-medium">
              {article.summary}
            </p>
          )}

          <div className="mt-auto pt-3.5 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between text-zinc-500/70">
            <div className="flex items-center gap-3.5">
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs font-bold tabular-nums">{fmtViews(article._count.likes)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs font-bold tabular-nums">{fmtViews(article.viewCount)}</span>
              </span>
            </div>
            
            {showReadTime && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                <Clock className="w-3 h-3" />
                {article.readTime}m
              </span>
            )}
          </div>
        </div>
      </Link>
    </GlanceTrigger>
  );
}
