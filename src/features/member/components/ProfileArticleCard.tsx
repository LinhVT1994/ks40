'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Heart, Clock, MessageSquare } from 'lucide-react';
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
          "group relative flex flex-col h-[350px] bg-white/40 dark:bg-white/[0.02] backdrop-blur-md max-md:backdrop-blur-sm border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-10px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_20px_50px_-10px_rgba(59,130,246,0.3)] animate-in fade-in slide-in-from-bottom-4 fill-mode-both cursor-pointer",
          className
        )}
      >
        <div className="h-[180px] overflow-hidden relative shrink-0">
          <Image
            src={article.thumbnail || '/placeholder-article.jpg'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            alt={article.title}
          />
          
          <div className="absolute top-3 left-3">
            <span
              className="backdrop-blur-md max-md:backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 text-[10px] font-black uppercase px-3 py-1 rounded-md tracking-widest shadow-sm border border-white/20 dark:border-white/5"
              style={{ color: article.topic.color ?? '#3B82F6' }}
            >
              {article.topic.label}
            </span>
          </div>
        </div>

        <div className="p-4 sm:px-5 sm:pt-5 sm:pb-5 flex flex-col justify-between flex-1 overflow-hidden">
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1 leading-tight">
              {article.title}
            </h3>
            {article.summary && (
              <p className="text-[11px] sm:text-[13px] text-zinc-500 line-clamp-3 leading-relaxed font-medium opacity-80">
                {article.summary}
              </p>
            )}
          </div>

          <div className="mt-auto pt-2 flex items-center justify-between text-zinc-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 hover:text-rose-500 transition-colors">
                <Heart className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold tabular-nums">{fmtViews(article._count.likes)}</span>
              </span>
              <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold tabular-nums">{fmtViews(article.viewCount)}</span>
              </span>
              <span className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold tabular-nums">{fmtViews(article._count.comments)}</span>
              </span>
            </div>
            
            {showReadTime && (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest opacity-70 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
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
