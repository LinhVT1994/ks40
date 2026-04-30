'use client';

import React, { useState, useTransition, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, MessageCircle, Eye, Clock, Bookmark, Users, FileText, 
  ChevronRight, Loader2, Lock, Star, Tag, LayoutGrid, ArrowDown,
  ArrowLeft, Calendar
} from 'lucide-react';
import { GlanceTrigger } from './GlancePreview';

import type { ArticleCard } from '@/features/articles/actions/article';
import { getArticlesAction } from '@/features/articles/actions/article';
import { toggleBookmarkAction } from '@/features/articles/actions/bookmark';
import { toggleTopicFollowAction } from '@/features/admin/actions/topic';
import type { TopicItem } from '@/features/admin/actions/topic';

const BADGE_LABELS: Record<string, string> = {
  HOT:      'Hot',
  NEW:      'New',
  TRENDING: 'Trending',
  FEATURED: 'Featured',
};

function formatDate(date: Date | null) {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface TopicPageProps {
  topic: TopicItem;
  parentTopic: TopicItem | null;
  children: TopicItem[];
  childCounts: Record<string, number>;
  isParent: boolean;
  currentSlug: string;
  initialArticles: ArticleCard[];
  totalPages: number;
  totalArticles: number;
  isLoggedIn: boolean;
  initialFollowing: boolean;
  followerCount: number;
  followTopicId: string;
}

export default function TopicPageClient({
  topic, parentTopic, children, childCounts, isParent, currentSlug,
  initialArticles, totalPages, totalArticles,
  isLoggedIn, initialFollowing, followerCount: initFollowerCount, followTopicId,
}: TopicPageProps) {
  const router = useRouter();
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(1 < totalPages);
  const [isPending, startTransition] = useTransition();

  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initFollowerCount);
  const [followPending, startFollowTransition] = useTransition();

  const [bookmarked, setBookmarked] = useState<Map<string, boolean>>(() => {
    const m = new Map<string, boolean>();
    initialArticles.forEach(a => { if (a.isBookmarked) m.set(a.id, true); });
    return m;
  });

  const handleFollow = () => {
    if (!isLoggedIn) return;
    const prev = following;
    setFollowing(!prev);
    setFollowers(f => f + (!prev ? 1 : -1));
    startFollowTransition(async () => {
      try {
        await toggleTopicFollowAction(followTopicId);
      } catch {
        setFollowing(prev);
        setFollowers(f => f + (prev ? 1 : -1));
      }
    });
  };

  const handleBookmark = useCallback((e: React.MouseEvent, articleId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) return;
    const next = !bookmarked.get(articleId);
    setBookmarked(prev => new Map(prev).set(articleId, next));
    toggleBookmarkAction(articleId).catch(() => {
      setBookmarked(prev => new Map(prev).set(articleId, !next));
    });
  }, [bookmarked, isLoggedIn]);

  const loadMore = () => {
    startTransition(async () => {
      const nextPage = page + 1;
      const { articles: more, totalPages: tp } = await getArticlesAction({
        topicId: topic.id,
        page: nextPage,
        limit: 20,
      });
      setArticles(prev => [...prev, ...more]);
      setPage(nextPage);
      setHasMore(nextPage < tp);
    });
  };

  const color = parentTopic?.color ?? topic.color ?? '#3b82f6';

  return (
    <div className="max-w-[1200px] 2xl:max-w-[1440px] mx-auto w-full px-8 md:px-8 pb-32">
      {/* Hero Header */}
      <header className="mt-8 sm:mt-12 flex flex-col items-start">
        {/* Back Button */}
        <button 
          onClick={() => router.push('/topics')}
          className="group flex items-center gap-2 text-zinc-500 dark:text-slate-300 hover:text-primary transition-all duration-300 text-[10px] font-bold uppercase tracking-widest mb-10"
        >
          <div className="w-8 h-8 rounded-full border border-zinc-300 dark:border-white/10 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span className="transition-all">
            Quay lại
          </span>
        </button>

        {/* Topic Info */}
        <div className="relative group/topic flex flex-col items-center w-full">
            <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-primary/5 border border-zinc-200 dark:border-white/5 bg-white dark:bg-white/5 mb-6 transition-transform group-hover/topic:scale-110 duration-500"
                style={{ color }}
            >
                {topic.emoji ?? '📁'}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-zinc-800 dark:text-white text-center">
                {topic.label}
            </h1>
            <p className="mt-3 text-zinc-500 dark:text-slate-300 font-medium text-center max-w-lg">
                Khám phá {totalArticles} kiến thức chuyên sâu về {topic.label} được chọn lọc bởi cộng đồng Lenote.
            </p>

            {/* Stats & Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-8">
                <div className="flex items-center gap-8 px-8 py-3 bg-white dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-bold text-zinc-800 dark:text-white">{formatCount(totalArticles)}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-300">Bài viết</span>
                    </div>
                    <div className="w-px h-8 bg-zinc-100 dark:bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-bold text-zinc-800 dark:text-white">{formatCount(followers)}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-300">Followers</span>
                    </div>
                </div>

                <button
                    onClick={handleFollow}
                    disabled={!isLoggedIn || followPending}
                    className={`group w-44 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                    following
                        ? 'bg-white dark:bg-white/10 border-2 text-zinc-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30'
                        : 'text-white'
                    }`}
                    style={
                    following
                        ? undefined
                        : { backgroundColor: color, boxShadow: `0 8px 16px ${color}30` }
                    }
                >
                    {followPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : following ? (
                        <div className="relative h-5 w-full flex items-center justify-center">
                          <span className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 group-hover:scale-95 transition-all duration-200">
                            Đang theo dõi
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                            Bỏ theo dõi
                          </span>
                        </div>
                    ) : (
                        <span className="h-5 flex items-center">Theo dõi</span>
                    )}
                </button>
            </div>
        </div>

        {/* Sub-topic Navigation Tabs */}
        {isParent && children.length > 0 && (
          <div className="mt-14 w-full flex flex-wrap items-center justify-center gap-3 pb-4">
            <Link
              href={`/topic/${parentTopic?.slug ?? topic.slug}`}
              className={`shrink-0 px-6 py-2.5 rounded-full text-[13px] font-bold transition-all border ${
                isParent
                  ? 'text-white border-transparent shadow-md'
                  : 'bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-500 dark:text-slate-300 hover:text-zinc-800 dark:hover:text-white'
              }`}
              style={isParent ? { backgroundColor: color } : undefined}
            >
              Tất cả
            </Link>
            {children.map(child => {
              const active = child.slug === currentSlug;
              const count = childCounts[child.id] ?? 0;
              return (
                <Link
                  key={child.id}
                  href={`/topic/${child.slug}`}
                  className={`shrink-0 px-6 py-2.5 rounded-full text-[13px] font-bold transition-all border ${
                    active
                      ? 'text-white border-transparent shadow-md'
                      : 'bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-500 dark:text-slate-300 hover:text-zinc-800 dark:hover:text-white'
                  }`}
                  style={active ? { backgroundColor: color } : undefined}
                >
                  {child.label}
                  {count > 0 && <span className={`ml-2 ${active ? 'text-white/70' : 'text-zinc-500 opacity-60'}`}>({count})</span>}
                </Link>
              );
            })}
          </div>
        )}

        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-100 dark:via-white/5 to-transparent mt-10" />
      </header>

      {/* Main Content Grid */}
      <div className="max-w-4xl 2xl:max-w-5xl mx-auto mt-16 items-start">
        
        {/* Article Feed */}
        <div className="w-full flex flex-col gap-2">
            {articles.length > 0 ? (
              articles.map((article, idx) => (
                <React.Fragment key={article.id}>
                  <div className="block group">
                    <GlanceTrigger article={article}>
                      <div className="py-4 sm:py-5 relative hover:bg-white dark:hover:bg-white/[0.03] hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col rounded-2xl px-3 sm:px-4 -mx-2 border border-transparent hover:border-zinc-200/50 dark:hover:border-white/5 cursor-pointer">
                        
                        {/* Focus Indicator */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-14 bg-primary rounded-full scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center" style={{ backgroundColor: color }} />

                        <div className="flex flex-row gap-3 sm:gap-5 items-start w-full">

                        {/* Thumbnail */}
                        <Link
                          href={`/article/${article.slug}`}
                          className="w-24 sm:w-40 2xl:w-52 h-20 sm:h-28 2xl:h-36 shrink-0 bg-cover bg-center relative rounded-xl overflow-hidden shadow-sm bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5"
                          style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
                        >
                          {!article.thumbnail && (
                            <div className="absolute inset-0 flex items-center justify-center text-zinc-300 dark:text-white/10 text-3xl font-bold transition-transform duration-700 group-hover:scale-110">
                              {article.title[0]}
                            </div>
                          )}
                          
                          {/* Shimmer Sweep */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none z-10 overflow-hidden">
                            <div 
                              className="absolute inset-0 w-2/3 h-full bg-white/30 blur-[40px] -skew-x-[20deg]"
                              style={{ animation: 'shimmer-sweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
                            />
                          </div>

                          {/* Badges */}
                          <div className="absolute top-1 right-1 flex flex-col gap-1 z-20">
                            {article.badges.slice(0, 1).map(b => (
                              <span key={b} className="bg-primary/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase shadow-sm" style={{ backgroundColor: color }}>
                                {BADGE_LABELS[b] ?? b}
                              </span>
                            ))}
                          </div>
                        </Link>

                        {/* Content Area */}
                        <div className="flex-1 min-w-0 flex flex-col pt-1 transition-transform duration-500 group-hover:translate-x-1">
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <Link href={`/article/${article.slug}`} className="flex-1">
                              <h4 className="text-[15px] sm:text-xl font-bold text-zinc-800 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors font-display line-clamp-2 leading-snug" style={{ '--tw-text-opacity': '1' } as any}>
                                {article.title}
                              </h4>
                            </Link>
                            
                            {/* Audience Badge */}
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
                            </div>
                          </div>

                          <Link href={`/article/${article.slug}`} className="mb-0 sm:mb-4">
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-slate-300 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                              {article.summary}
                            </p>
                          </Link>

                          {/* Desktop Stats */}
                          <div className="hidden sm:flex mt-auto items-end justify-between pt-0 gap-2">
                            <div className="flex items-center flex-wrap gap-x-5 text-zinc-500 dark:text-slate-300 text-xs">
                              {/* Author Info */}
                              <div className="flex items-center border-r border-zinc-200 dark:border-white/10 pr-5 relative z-30">
                                <Link 
                                  href={`/@${article.author.username || article.author.id}`}
                                  className="font-semibold text-zinc-600 dark:text-slate-300 text-[11px] hover:text-primary transition-colors"
                                >
                                  <span className="font-normal opacity-70">bởi</span> {article.author.name}
                                </Link>
                              </div>

                              <span className="flex items-center gap-1.5 group/stat transition-colors hover:text-rose-500 font-bold">
                                <Heart className="w-4 h-4 group-hover/stat:fill-rose-500/10" />
                                {formatCount(article._count.likes)}
                              </span>
                              <span className="flex items-center gap-1.5 group/stat transition-colors hover:text-primary font-bold">
                                <MessageCircle className="w-4 h-4 group-hover/stat:fill-primary/10" />
                                {formatCount(article._count.comments)}
                              </span>
                              <span className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-4 h-4" />
                                <span className="font-medium text-[10px]">{formatCount(article.viewCount)}</span>
                              </span>
                              <span className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-white/10 pl-5 ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Clock className="w-4 h-4" />
                                <span className="font-medium text-[10px]">{article.readTime} phút</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {article.publishedAt && (
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 dark:text-slate-400 mr-2 tracking-tight">
                                      <Calendar className="w-3 h-3 opacity-70" />
                                      <span>{formatDate(article.publishedAt)}</span>
                                  </div>
                              )}
                              <button
                                onClick={(e) => handleBookmark(e, article.id)}
                                className={`p-1.5 rounded-lg transition-all relative z-40 ${bookmarked.get(article.id) ? 'text-primary bg-primary/5' : 'text-zinc-300 hover:text-primary dark:text-white/20 dark:hover:text-primary hover:bg-primary/5'}`}
                                title={bookmarked.get(article.id) ? 'Bỏ lưu' : 'Lưu bài viết'}
                              >
                                <Bookmark className={`w-4 h-4 transition-all ${bookmarked.get(article.id) ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>{/* end content area */}
                        </div>{/* end flex-row */}
                      </div>{/* end flex-col card */}
                    </GlanceTrigger>

                    {/* Mobile Stats (Full width footer) */}
                    <div className="flex sm:hidden mt-3 items-center justify-between pt-3 border-t border-zinc-100/80 dark:border-white/5 gap-2 w-full">
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-zinc-500 dark:text-slate-400 text-[11px] font-medium">
                            <div className="flex items-center border-r border-zinc-200 dark:border-white/10 pr-3.5 relative z-30">
                              <Link 
                                href={`/@${article.author.username || article.author.id}`}
                                className="font-semibold text-zinc-600 dark:text-slate-300 text-[10px] hover:text-primary transition-colors"
                              >
                                <span className="font-normal opacity-70">bởi</span> {article.author.name}
                              </Link>
                            </div>
                            <span className="flex items-center gap-1.5 group/stat hover:text-rose-500">
                              <Heart className="w-3.5 h-3.5" />
                              {formatCount(article._count.likes)}
                            </span>
                            <span className="flex items-center gap-1.5 group/stat hover:text-primary">
                              <MessageCircle className="w-3.5 h-3.5" />
                              {formatCount(article._count.comments)}
                            </span>
                            <span className="flex items-center gap-1.5 opacity-60">
                              <Eye className="w-3.5 h-3.5" />
                              {formatCount(article.viewCount)}
                            </span>
                            <span className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-white/10 pl-3 opacity-60">
                              <Clock className="w-3.5 h-3.5" />
                              {article.readTime}p
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {article.publishedAt && (
                              <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                                  <span>{formatDate(article.publishedAt)}</span>
                              </div>
                            )}
                            <button
                              onClick={(e) => handleBookmark(e, article.id)}
                              className={`p-1 rounded-lg transition-all relative z-40 ${bookmarked.get(article.id) ? 'text-primary' : 'text-zinc-300 dark:text-white/20'}`}
                            >
                              <Bookmark className={`w-4 h-4 ${bookmarked.get(article.id) ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
                {idx < articles.length - 1 && <div className="h-px bg-zinc-100 dark:bg-white/5 w-full my-3" />}
              </React.Fragment>
              ))
            ) : (
                <div className="py-24 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-white/10 bg-white/50 dark:bg-white/5">
                    <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-xl shadow-primary/5" style={{ backgroundColor: color + '15' }}>
                        {topic.emoji ?? '📭'}
                    </div>
                    <h3 className="text-xl font-bold text-zinc-800 dark:text-white mb-2">Chưa có bài viết</h3>
                    <p className="text-zinc-500 dark:text-slate-300 text-sm max-w-xs mx-auto">Chủ đề này đang được đội ngũ biên tập chuẩn bị nội dung. Hãy quay lại sau nhé!</p>
                </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-12 pb-20">
                <button
                  disabled={isPending}
                  onClick={loadMore}
                  className="group relative flex items-center justify-center gap-3 px-8 py-3 bg-white dark:bg-white/5 text-zinc-600 dark:text-slate-300 rounded-full font-bold text-[13px] border border-zinc-300 dark:border-white/10 hover:border-primary/50 hover:text-primary transition-all duration-300 active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Tải thêm kiến thức</span>
                      <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
