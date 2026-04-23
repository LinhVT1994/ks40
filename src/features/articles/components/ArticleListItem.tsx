'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Clock, Eye, Tag, Bookmark, Star, Lock, Calendar } from 'lucide-react';
import { GlanceTrigger } from '@/features/member/components/GlancePreview';
import { cn } from '@/lib/utils';
import type { ArticleCard } from '@/features/articles/actions/article';

interface ArticleListItemProps {
  article: ArticleCard;
  isBookmarked?: boolean;
  onBookmark?: (e: React.MouseEvent, id: string) => void;
  highlight?: (text: string) => React.ReactNode;
}

const BADGE_LABELS: Record<string, string> = {
  HOT: 'Hot',
  NEW: 'New',
  TRENDING: 'Trending',
  FEATURED: 'Featured',
};

function formatViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatDate(date: Date | null) {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function ArticleListItem({
  article,
  isBookmarked,
  onBookmark,
  highlight,
}: ArticleListItemProps) {
  const renderText = (text: string) => (highlight ? highlight(text) : text);

  return (
    <div className="block group">
      <GlanceTrigger article={article}>
        <div className="py-3 sm:py-4 relative hover:bg-white dark:hover:bg-white/[0.03] hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col rounded-2xl px-2 sm:px-3 -mx-1 border border-transparent hover:border-zinc-200/50 dark:hover:border-white/5 cursor-pointer">
          
          {/* Focus Indicator Bar */}
          <div className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-full scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center",
            article.audience === 'PREMIUM' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-primary'
          )} />

          <div className="flex flex-row gap-3 sm:gap-4 items-start w-full">
            {/* Thumbnail Link */}
            <Link
              href={`/article/${article.slug}`}
              className={cn(
                "w-24 sm:w-36 2xl:w-48 h-20 sm:h-28 2xl:h-32 shrink-0 relative rounded-xl overflow-hidden shadow-sm bg-zinc-100 dark:bg-white/5 border transition-colors duration-500",
                article.audience === 'PREMIUM' 
                  ? 'border-amber-200/50 dark:border-amber-500/20 group-hover:border-amber-500/50 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                  : 'border-zinc-200 dark:border-white/5 group-hover:border-primary/30'
              )}
            >
              {article.thumbnail ? (
                <Image
                  src={article.thumbnail}
                  alt={article.title}
                  fill
                  sizes="(max-width: 640px) 96px, (max-width: 1536px) 144px, 192px"
                  className="object-cover"
                  style={{ objectPosition: article.thumbnailPosition ?? '50% 50%' }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-300 dark:text-white/10 text-3xl font-bold transition-transform duration-700 group-hover:scale-110">
                  {article.title[0]}
                </div>
              )}
              
              {/* Shimmer Sweep Overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none z-10 overflow-hidden">
                <div 
                  className="absolute inset-0 w-2/3 h-full bg-white/30 blur-[40px] -skew-x-[20deg]"
                  style={{ animation: 'shimmer-sweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
                />
              </div>

              {/* Badges */}
              <div className="absolute top-1 right-1 flex flex-col gap-1 z-20">
                {article.badges.slice(0, 1).map(b => (
                  <span key={b} className="bg-primary/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase shadow-sm">
                    {BADGE_LABELS[b] ?? b}
                  </span>
                ))}
              </div>
            </Link>

            {/* Content Area */}
            <div className="flex-1 min-w-0 flex flex-col pt-0.5 transition-transform duration-500 group-hover:translate-x-1">
              <div className="flex items-start justify-between gap-3 mb-1">
                <Link href={`/article/${article.slug}`} className="flex-1">
                  <h4 className="text-[15px] sm:text-lg font-bold text-zinc-800 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors font-display line-clamp-2 leading-tight">
                    {renderText(article.title)}
                  </h4>
                </Link>
                
                {/* Top-right Badges */}
                <div className="shrink-0 hidden sm:flex items-center gap-2 mt-0.5">
                  {article.audience === 'PREMIUM' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-500/20">
                      <Star className="w-2.5 h-2.5 fill-current" /> Premium
                    </span>
                  )}
                  {article.audience === 'MEMBERS' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-500/20">
                      <Lock className="w-2.5 h-2.5" /> Members
                    </span>
                  )}
                  <Link 
                      href={`/topic/${article.topic.slug}`}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-wider border border-zinc-300 dark:border-white/5 hover:border-primary/30 hover:text-primary transition-colors relative z-30"
                  >
                      <Tag className="w-2.5 h-2.5" />
                      {article.topic.label}
                  </Link>
                </div>
              </div>

              <Link href={`/article/${article.slug}`} className="mb-0 sm:mb-3">
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-slate-400 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                  {article.summary && renderText(article.summary)}
                </p>
              </Link>

              {/* Desktop Stats */}
              <div className="hidden sm:flex mt-auto items-end justify-between pt-0 gap-2">
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-zinc-500 text-xs">
                  {/* Author Info Integrated into Stats */}
                  <div className="flex items-center border-r border-zinc-200 dark:border-white/10 pr-4">
                    <Link 
                      href={`/profile/${article.author.username || article.author.id}`}
                      className="font-semibold text-zinc-600 dark:text-slate-300 text-[11px] hover:text-primary transition-colors relative z-30 flex items-center gap-1"
                    >
                      <span className="font-normal opacity-70">bởi</span> {article.author.name}
                    </Link>
                  </div>

                  <span className="flex items-center gap-1 group/stat transition-colors hover:text-rose-500">
                    <Heart className="w-3.5 h-3.5 group-hover/stat:fill-rose-500/10" />
                    <span className="font-bold">{article._count.likes}</span>
                  </span>
                  <span className="flex items-center gap-1 group/stat transition-colors hover:text-primary">
                    <MessageCircle className="w-3.5 h-3.5 group-hover/stat:fill-primary/10" />
                    <span className="font-bold">{article._count.comments}</span>
                  </span>
                  <span className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="font-medium text-[10px]">{formatViews(article.viewCount)}</span>
                  </span>
                  {(article.ratingCount ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-3.5 h-3.5 fill-yellow-400" />
                      <span className="font-bold text-[10px]">{(article.avgRating ?? 0).toFixed(1)}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 border-l border-zinc-200 dark:border-white/10 pl-4 ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-medium text-[10px]">{article.readTime} phút</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {article.publishedAt && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 dark:text-slate-400 mr-3 tracking-tight">
                          <Calendar className="w-3 h-3 opacity-70" />
                          <span>{formatDate(article.publishedAt)}</span>
                      </div>
                  )}
                  {onBookmark && (
                    <button
                      onClick={(e) => onBookmark(e, article.id)}
                      className={cn(
                        "p-1.5 rounded-lg transition-all relative z-40",
                        isBookmarked 
                          ? 'text-primary bg-primary/5' 
                          : 'text-zinc-300 hover:text-primary dark:text-white/20 dark:hover:text-primary hover:bg-primary/5'
                      )}
                      title={isBookmarked ? 'Bỏ lưu' : 'Lưu bài viết'}
                    >
                      <Bookmark className={cn("w-4 h-4 transition-all", isBookmarked ? 'fill-current' : '')} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Stats (Full width footer) */}
          <div className="flex sm:hidden mt-3 items-center justify-between pt-2.5 border-t border-zinc-100/80 dark:border-white/5 gap-2 w-full">
            <div className="flex items-center flex-wrap gap-x-3 gap-y-2 text-zinc-500 dark:text-slate-400 text-[11px] font-medium">
              <div className="flex items-center border-r border-zinc-200 dark:border-white/10 pr-3">
                <Link 
                  href={`/profile/${article.author.username || article.author.id}`}
                  className="font-semibold text-zinc-600 dark:text-slate-300 text-[10px] hover:text-primary transition-colors relative z-30 flex items-center gap-1"
                >
                  <span className="font-normal opacity-70">bởi</span> {article.author.name}
                </Link>
              </div>
              <span className="flex items-center gap-1 group/stat hover:text-rose-500">
                <Heart className="w-3.5 h-3.5" />
                <span className="font-bold">{article._count.likes}</span>
              </span>
              <span className="flex items-center gap-1 group/stat hover:text-primary">
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="font-bold">{article._count.comments}</span>
              </span>
              <span className="flex items-center gap-1 opacity-60">
                <Eye className="w-3.5 h-3.5" />
                <span>{formatViews(article.viewCount)}</span>
              </span>
              {(article.ratingCount ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  <span className="font-bold">{(article.avgRating ?? 0).toFixed(1)}</span>
                </span>
              )}
              <span className="flex items-center gap-1 border-l border-zinc-200 dark:border-white/10 pl-2 opacity-60">
                <Clock className="w-3 h-3" />
                <span>{article.readTime}p</span>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {article.publishedAt && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                    <span>{formatDate(article.publishedAt)}</span>
                </div>
              )}
              {onBookmark && (
                <button
                  onClick={(e) => onBookmark(e, article.id)}
                  className={cn("p-1 rounded-lg transition-all relative z-40", isBookmarked ? 'text-primary' : 'text-zinc-300 dark:text-white/20')}
                >
                  <Bookmark className={cn("w-4 h-4", isBookmarked ? 'fill-current' : '')} />
                </button>
              )}
            </div>
          </div>
        </div>
      </GlanceTrigger>
    </div>
  );
}
