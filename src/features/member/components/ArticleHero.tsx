'use client';

import { Tag, Clock, UserPlus, UserCheck, Heart, Bookmark, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Avatar from '@/components/shared/Avatar';
import type { ArticleFull } from '@/features/articles/actions/article';
import { useInteractionOptional } from '@/features/articles/context/ArticleInteractionContext';
import ShareMenu from '@/components/shared/ShareMenu';


export default function ArticleHero({ article }: { article: ArticleFull }) {
  const interaction = useInteractionOptional();

  const date = article.publishedAt
    ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(article.publishedAt))
    : '';

  return (
    <div className="w-full relative overflow-visible mb-12 group/hero">
      {/* Background Aesthetic Glow */}
      <div aria-hidden="true" className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse duration-[10s]" />
      <div aria-hidden="true" className="absolute top-0 -right-24 w-72 h-72 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <div className="flex flex-col gap-10">
        {article.cover && (
          <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] relative group/cover animate-in fade-in zoom-in-95 duration-500 border border-zinc-200/50 dark:border-white/5">
            <Image
              src={article.cover}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 820px"
              className="object-cover transition-transform duration-[2s] ease-out group-hover/cover:scale-110"
              style={{ objectPosition: article.coverPosition ?? '50% 50%' }}
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover/cover:opacity-40 transition-opacity duration-700" />
            <div aria-hidden="true" className="absolute inset-0 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-1000 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        <div className="w-full max-w-[720px] mx-auto flex flex-col gap-6">
          <div className="flex">
            <Link
              href={`/topic/${article.topic.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em] border border-primary/20 hover:bg-primary hover:text-white transition-all duration-300"
            >
              <Tag className="w-3 h-3" />
              {article.topic.label}
            </Link>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 font-display leading-[1.15] tracking-tight text-left animate-in fade-in slide-in-from-bottom-2 duration-500">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-10 gap-y-6 text-zinc-500 dark:text-zinc-500 text-sm animate-in fade-in duration-500 delay-75">
            <Link href={`/profile/${article.author.username || article.authorId}`} className="flex items-center gap-3.5 hover:text-primary transition-colors group/author">
              <div className="relative">
                <Avatar src={article.author.image} name={article.author.name} size={44} />
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 scale-110 opacity-0 group-hover/author:opacity-100 transition-all duration-300" />
              </div>
              <div className="flex flex-col -space-y-0.5">
                <span className="text-[10px] uppercase tracking-[0.15em] font-black text-zinc-400 dark:text-zinc-500 mb-0.5">Tác giả</span>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover/author:text-primary transition-colors">{article.author.name}</span>
              </div>
            </Link>

            {interaction?.author?.id && (
              <button
                onClick={interaction.handleFollow}
                disabled={interaction.followPending}
                className={`group/follow inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-300 border disabled:opacity-60 ${
                  interaction.isFollowing
                    ? 'bg-zinc-100 dark:bg-white/10 text-zinc-500 border-zinc-200 dark:border-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/20'
                    : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-transparent hover:translate-y-[-1px] active:scale-95 shadow-sm'
                }`}
              >
                {interaction.isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 group-hover/follow:hidden" />
                    <UserPlus className="w-3.5 h-3.5 hidden group-hover/follow:block rotate-45" />
                    <span className="group-hover/follow:hidden">Đang theo dõi</span>
                    <span className="hidden group-hover/follow:inline">Hủy theo dõi</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Theo dõi</span>
                  </>
                )}
              </button>
            )}

            <div className="h-10 w-px bg-zinc-200 dark:bg-white/10 hidden sm:block" />

            <div className="flex flex-row sm:flex-col gap-6 sm:gap-0 sm:-space-y-0.5">
              {date && (
                <div className="flex flex-col -space-y-0.5">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-black text-zinc-400 dark:text-zinc-500 mb-0.5">Xuất bản</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{date}</span>
                </div>
              )}
            </div>

            <div className="h-10 w-px bg-zinc-200 dark:bg-white/10 hidden sm:block" />

            <div className="flex flex-col -space-y-0.5">
              <span className="text-[10px] uppercase tracking-[0.15em] font-black text-zinc-400 dark:text-zinc-500 mb-0.5">Thời lượng</span>
              <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>{article.readTime} phút đọc</span>
              </div>
            </div>
          </div>

          {/* Quick-action row — primary entry for Like/Bookmark/Share on mobile & tablet.
              Desktop already has FloatingInteractionHub, so hide there. */}
          {interaction && (
            <div className="xl:hidden flex items-center gap-2 pt-2">
              <button
                onClick={interaction.handleLike}
                disabled={interaction.likePending}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold transition-all border disabled:opacity-60 ${
                  interaction.liked
                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-500/20'
                    : 'bg-zinc-50 dark:bg-white/[0.03] text-zinc-500 border-transparent hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-500/20'
                }`}
              >
                <Heart className={`w-4 h-4 ${interaction.liked ? 'fill-current' : ''}`} />
                <span className="tabular-nums">{interaction.likes}</span>
              </button>

              <button
                onClick={interaction.handleBookmark}
                disabled={interaction.bookmarkPending}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold transition-all border disabled:opacity-60 ${
                  interaction.bookmarked
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-zinc-50 dark:bg-white/[0.03] text-zinc-500 border-transparent hover:text-primary hover:bg-primary/10 hover:border-primary/20'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${interaction.bookmarked ? 'fill-current' : ''}`} />
                <span>{interaction.bookmarked ? 'Đã lưu' : 'Lưu'}</span>
              </button>

              <ShareMenu
                align="left"
                trigger={
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold bg-zinc-50 dark:bg-white/[0.03] text-zinc-500 border border-transparent hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all">
                    <Share2 className="w-4 h-4" />
                    <span>Chia sẻ</span>
                  </span>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
