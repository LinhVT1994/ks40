'use client';

import React, { useState, useMemo, useRef, useTransition, useCallback, useEffect } from 'react';
import { Heart, MessageCircle, LayoutGrid, Clock, Eye, Loader2, Bookmark, ChevronRight, ArrowDown, Star, Lock, Tag, Filter, Calendar } from 'lucide-react';
import Link from 'next/link';
import TagList from './TagList';
import type { ArticleCard } from '@/features/articles/actions/article';
import { getArticlesAction, getForYouArticlesAction } from '@/features/articles/actions/article';
import { toggleBookmarkAction, getBookmarksAction } from '@/features/articles/actions/bookmark';
import type { TopicItem } from '@/features/admin/actions/topic';

const BADGE_LABELS: Record<string, string> = {
  HOT:      'Hot',
  NEW:      'New',
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

const LIMIT = 20;

export default function FeatureCards({
  initialFollowedArticles,
  initialFollowedTotalPages,
  initialDiscoveryArticles,
  initialDiscoveryTotalPages,
  isLoggedIn,
  popularTags,
  topicIds,
  topics,
  activeTopicId,
  currentUserId,
  currentUsername,
  initialHistory,
  initialFeed = 'followed',
}: {
  initialFollowedArticles: ArticleCard[];
  initialFollowedTotalPages: number;
  initialDiscoveryArticles: ArticleCard[];
  initialDiscoveryTotalPages: number;
  isLoggedIn: boolean;
  popularTags: { id: string; name: string; slug: string; count: number }[];
  topicIds: string[];
  topics: TopicItem[];
  activeTopicId?: string;
  currentUserId?: string;
  currentUsername?: string;
  initialHistory?: any[];
  initialFeed?: 'followed' | 'discovery' | 'saved';
}) {
  const [activeFeed, setActiveFeed] = useState<'followed' | 'discovery' | 'saved'>(
    !isLoggedIn ? 'discovery' : initialFeed
  );
  const [activeTimeframe, setActiveTimeframe] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  const [followedArticles, setFollowedArticles] = useState(initialFollowedArticles);
  const [discoveryArticles, setDiscoveryArticles] = useState(initialDiscoveryArticles);
  const [savedArticles, setSavedArticles] = useState<ArticleCard[]>([]);
  
  const [followedPage, setFollowedPage] = useState(1);
  const [discoveryPage, setDiscoveryPage] = useState(1);
  const [savedPage, setSavedPage] = useState(1);

  const [followedTotalPages, setFollowedTotalPages] = useState(initialFollowedTotalPages);
  const [discoveryTotalPages, setDiscoveryTotalPages] = useState(initialDiscoveryTotalPages);
  const [savedTotalPages, setSavedTotalPages] = useState(1);
  
  const [isPending, startTransition] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const timeframeRef = useRef<HTMLDivElement>(null);

  const currentArticles = useMemo(() => {
    if (activeFeed === 'followed') return followedArticles;
    if (activeFeed === 'discovery') return discoveryArticles;
    return savedArticles;
  }, [activeFeed, followedArticles, discoveryArticles, savedArticles]);

  const currentTotalPages = useMemo(() => {
    if (activeFeed === 'followed') return followedTotalPages;
    if (activeFeed === 'discovery') return discoveryTotalPages;
    return savedTotalPages;
  }, [activeFeed, followedTotalPages, discoveryTotalPages, savedTotalPages]);

  const currentPage = useMemo(() => {
    if (activeFeed === 'followed') return followedPage;
    if (activeFeed === 'discovery') return discoveryPage;
    return savedPage;
  }, [activeFeed, followedPage, discoveryPage, savedPage]);

  const hasMore = currentPage < currentTotalPages;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeframeRef.current && !timeframeRef.current.contains(event.target as Node)) {
        setIsTimeframeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeframeOptions = [
    { id: 'all', label: 'Tất cả thời gian' },
    { id: 'today', label: 'Hôm nay' },
    { id: 'week', label: 'Tuần này' },
    { id: 'month', label: 'Tháng này' },
  ] as const;

  const activeTimeframeLabel = timeframeOptions.find(o => o.id === activeTimeframe)?.label || 'Tất cả';

  // Refined re-fetching logic
  const refreshFeed = useCallback((feed: 'followed' | 'discovery' | 'saved', timeframe: any) => {
    setIsTimeframeOpen(false);
    startTransition(async () => {
      let action: any = getArticlesAction;
      if (feed === 'followed') action = getForYouArticlesAction;
      else if (feed === 'saved') action = getBookmarksAction;

      const { articles, totalPages } = await action({
        topicIds: feed === 'followed' && topicIds.length > 0 ? topicIds : undefined,
        limit: LIMIT,
        page: 1,
        timeframe: timeframe,
      });

      if (feed === 'followed') {
        setFollowedArticles(articles);
        setFollowedPage(1);
        setFollowedTotalPages(totalPages);
      } else if (feed === 'discovery') {
        setDiscoveryArticles(articles);
        setDiscoveryPage(1);
        setDiscoveryTotalPages(totalPages);
      } else {
        setSavedArticles(articles);
        setSavedPage(1);
        setSavedTotalPages(totalPages);
      }
    });
  }, [topicIds]);

  const handleTimeframeChange = (tf: any) => {
    if (tf === activeTimeframe) {
      setIsTimeframeOpen(false);
      return;
    }
    setActiveTimeframe(tf);
    refreshFeed(activeFeed, tf);
  };

  const handleFeedChange = (feed: 'followed' | 'discovery' | 'saved') => {
    if (feed === activeFeed) return;
    setActiveFeed(feed);
    refreshFeed(feed, activeTimeframe);
  };

  // Bookmarking
  const [bookmarked, setBookmarked] = useState<Map<string, boolean>>(() => {
    const m = new Map<string, boolean>();
    [...initialFollowedArticles, ...initialDiscoveryArticles].forEach(a => { if (a.isBookmarked) m.set(a.id, true); });
    return m;
  });
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);

  const handleBookmark = useCallback((e: React.MouseEvent, articleId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !bookmarked.get(articleId);
    setBookmarked(prev => new Map(prev).set(articleId, next));
    toggleBookmarkAction(articleId).catch(() => {
      setBookmarked(prev => new Map(prev).set(articleId, !next));
    });
    const id = Date.now();
    setToast({ msg: next ? 'Đã lưu bài viết' : 'Đã bỏ lưu', id });
    setTimeout(() => setToast(t => t?.id === id ? null : t), 2000);
  }, [bookmarked]);

  const handleLoadMore = useCallback(() => {
    if (currentPage >= currentTotalPages || isPending) return;

    startTransition(async () => {
      const nextPage = currentPage + 1;
      let action: any = getArticlesAction;
      if (activeFeed === 'followed') action = getForYouArticlesAction;
      else if (activeFeed === 'saved') action = getBookmarksAction;
      
      const { articles: more } = await action({
        topicIds: activeFeed === 'followed' && topicIds.length > 0 ? topicIds : undefined,
        limit: LIMIT,
        page: nextPage,
        timeframe: activeTimeframe,
      });

      if (activeFeed === 'followed') {
        setFollowedArticles(prev => [...prev, ...more]);
        setFollowedPage(nextPage);
      } else if (activeFeed === 'discovery') {
        setDiscoveryArticles(prev => [...prev, ...more]);
        setDiscoveryPage(nextPage);
      } else {
        setSavedArticles(prev => [...prev, ...more]);
        setSavedPage(nextPage);
      }
    });
  }, [currentPage, currentTotalPages, isPending, activeFeed, topicIds, activeTimeframe]);

  return (
    <section ref={topRef} className="mt-6 sm:mt-8 lg:mt-12 overflow-visible">
      <div className="flex flex-col lg:flex-row xl:grid xl:grid-cols-12 gap-10 items-stretch">
        
        {/* Sidebar Topics */}
        <aside className="lg:w-52 xl:col-span-2 shrink-0 relative">
          <div className="lg:sticky lg:top-[100px]">

            <div className="flex items-center gap-2 mb-3 lg:mb-4 px-2">
              <LayoutGrid className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-800 dark:text-white">Chủ đề của bạn</h3>
            </div>

            {/* Mobile: wrap chips — giống phần Thẻ phổ biến bên dưới */}
            <nav className="lg:hidden pb-4">
              <div className="flex flex-wrap gap-2 px-1">
                {topics.length > 0 ? topics.map(t => (
                  <Link
                    key={t.id}
                    href={`/topic/${t.slug}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      activeTopicId === t.id
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-600 dark:text-slate-400 hover:border-primary/30 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className={`text-[10px] font-bold ml-0.5 ${
                      activeTopicId === t.id ? 'text-primary' : 'text-zinc-500 opacity-50'
                    }`}>
                      {t._count?.articles ?? 0}
                    </span>
                  </Link>
                )) : null}
                <Link
                  href="/topics"
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-dashed border-zinc-300 dark:border-white/15 text-zinc-500 hover:text-primary hover:border-primary/40 transition-all"
                >
                  + Khám phá
                </Link>
              </div>
            </nav>

            {/* Desktop: vertical sidebar — unchanged */}
            <nav className="hidden lg:flex flex-col gap-1.5 pb-4 lg:pb-0 px-1">
              {topics.length > 0 ? (
                topics.map(t => {
                  const isFollowed = topicIds.includes(t.id);
                  const isChild = !!t.parentId;
                  return (
                    <Link
                      key={t.id}
                      href={`/topic/${t.slug}`}
                      className={`px-3 py-2 rounded-lg text-sm transition-all text-left flex items-center justify-between border group/item ${
                        activeTopicId === t.id
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-sm shadow-primary/5 font-bold'
                          : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 border-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="truncate">{t.label}</span>
                        {!isFollowed && !isChild && (
                           <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 uppercase tracking-tighter">Đề xuất</span>
                        )}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                          activeTopicId === t.id
                            ? 'bg-primary/20 text-primary'
                            : 'bg-zinc-200/50 dark:bg-white/10 text-zinc-500 group-hover/item:text-primary group-hover/item:bg-primary/10'
                        }`}>
                          {t._count?.articles ?? 0}
                        </span>
                      </div>
                      {activeTopicId === t.id && <ChevronRight className="w-4 h-4" />}
                    </Link>
                  );
                })
              ) : (
                <div className="px-3 py-4 rounded-xl border border-dashed border-zinc-300 dark:border-white/10 text-center">
                  <p className="text-[11px] font-medium text-zinc-500 leading-relaxed">
                    Bạn chưa theo dõi chủ đề nào. 
                  </p>
                </div>
              )}
              <div className="pt-4 mt-2 border-t border-zinc-200 dark:border-white/5">
                <Link
                  href="/topics"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                >
                  Khám phá thêm
                  <LayoutGrid className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Feed Content */}
        <div className="flex-1 xl:col-span-7">
          {/* Feed Switcher Tabs & Dropdown */}
          <div className="flex items-center justify-between mb-10 border-b border-zinc-200 dark:border-white/5 relative">
            <div className="flex items-center gap-8">
              {(() => {
                const availableTabs = [
                  ...(isLoggedIn ? [{ id: 'followed', label: 'Theo dõi' }] : []),
                  { id: 'discovery', label: 'Khám phá' },
                  ...(isLoggedIn ? [{ id: 'saved', label: 'Đã lưu' }] : [])
                ];

                return availableTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleFeedChange(tab.id as any)}
                    className={`pb-4 text-[13px] font-bold uppercase tracking-widest transition-all relative ${
                      activeFeed === tab.id 
                        ? 'text-primary' 
                        : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                    {activeFeed === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
                    )}
                  </button>
                ));
              })()}
            </div>

            {/* Timeframe Dropdown */}
            <div className="relative mb-4 flex items-center gap-3" ref={timeframeRef}>
               {activeTimeframe !== 'all' && (
                 <span className="text-[10px] font-bold uppercase tracking-wider text-primary animate-in fade-in slide-in-from-right-2">
                   {activeTimeframeLabel}
                 </span>
               )}
               <button
                onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
                className={`p-2 rounded-xl border transition-all ${
                  activeTimeframe !== 'all'
                    ? 'bg-primary/5 text-primary border-primary/20'
                    : 'text-zinc-500 border-transparent hover:bg-zinc-50 dark:hover:bg-white/5'
                }`}
               >
                 <Filter className="w-3.5 h-3.5" />
               </button>

               {/* Dropdown Menu */}
               {isTimeframeOpen && (
                 <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                    {timeframeOptions.map(o => (
                      <button
                        key={o.id}
                        onClick={() => handleTimeframeChange(o.id)}
                        className={`w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-zinc-50 dark:hover:bg-white/5 ${
                          activeTimeframe === o.id ? 'text-primary' : 'text-zinc-500 dark:text-slate-400'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                 </div>
               )}
            </div>
          </div>

          <div className="flex flex-col">
            {currentArticles.length > 0 ? (
              currentArticles.map((article, idx) => (
                <React.Fragment key={article.id}>
                  <div className="block group">
                    <div className="py-3 sm:py-4 relative hover:bg-white dark:hover:bg-white/[0.03] hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col rounded-2xl px-2 sm:px-3 -mx-1 border border-transparent hover:border-zinc-200/50 dark:hover:border-white/5">
                      
                      {/* Focus Indicator Bar */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-full scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center" />

                      <div className="flex flex-row gap-3 sm:gap-4 items-start w-full">

                      {/* Thumbnail Link */}
                      <Link
                        href={`/article/${article.slug}`}
                        className="w-24 sm:w-36 h-20 sm:h-28 shrink-0 bg-cover bg-center relative rounded-xl overflow-hidden shadow-sm bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5"
                        style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
                      >
                        {!article.thumbnail && (
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
                              {article.title}
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
                          <p className="text-xs sm:text-sm text-zinc-500 dark:text-slate-400 sm:line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                            {article.summary}
                          </p>
                        </Link>

                        {/* Desktop Stats */}
                        <div className="hidden sm:flex mt-auto items-end justify-between pt-0 gap-2">
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-zinc-500 text-xs">
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
                            <button
                              onClick={(e) => handleBookmark(e, article.id)}
                              className={`p-1.5 rounded-lg transition-all relative z-40 ${bookmarked.get(article.id) ? 'text-primary bg-primary/5' : 'text-zinc-300 hover:text-primary dark:text-white/20 dark:hover:text-primary hover:bg-primary/5'}`}
                              title={bookmarked.get(article.id) ? 'Bỏ lưu' : 'Lưu bài viết'}
                            >
                              <Bookmark className={`w-4 h-4 transition-all ${bookmarked.get(article.id) ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Stats (Full width footer) */}
                    <div className="flex sm:hidden mt-3 items-center justify-between pt-2.5 border-t border-zinc-100/80 dark:border-white/5 gap-2 w-full">
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-2 text-zinc-500 dark:text-slate-400 text-[11px] font-medium">
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
                            <button
                              onClick={(e) => handleBookmark(e, article.id)}
                              className={`p-1 rounded-lg transition-all relative z-40 ${bookmarked.get(article.id) ? 'text-primary' : 'text-zinc-300 dark:text-white/20'}`}
                            >
                              <Bookmark className={`w-4 h-4 ${bookmarked.get(article.id) ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                    </div>

                    </div>
                  </div>
                  {idx < currentArticles.length - 1 && <div className="h-px bg-zinc-100 dark:bg-white/5 w-full my-1" />}
                </React.Fragment>
              ))
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-center px-6 animate-in fade-in duration-700">
                <Filter className="w-8 h-8 text-zinc-200 dark:text-white/10 mb-6" />
                <h3 className="text-base font-bold text-zinc-500 dark:text-slate-500 mb-2">
                  {activeTimeframe !== 'all' 
                    ? `Không có bài viết nào trong ${activeTimeframeLabel.toLowerCase()}` 
                    : activeFeed === 'followed' 
                      ? 'Bắt đầu cá nhân hóa Feed của bạn' 
                      : 'Không tìm thấy bài viết nào'}
                </h3>
                <p className="text-xs text-zinc-500/80 dark:text-slate-500/80 max-w-xs mb-8 leading-relaxed">
                  {activeTimeframe !== 'all'
                    ? 'Hãy thử chọn một mốc thời gian khác hoặc quay lại xem tất cả bài viết.'
                    : activeFeed === 'followed' 
                      ? 'Hãy theo dõi ít nhất một chủ đề yêu thích để chúng tôi gợi ý những nội dung chất lượng nhất dành riêng cho bạn.'
                      : 'Hiện tại chưa có bài viết nào trong danh sách này. Hãy quay lại sau nhé!'}
                </p>
                {activeFeed === 'followed' && activeTimeframe === 'all' && (
                  <Link 
                    href="/topics"
                    className="text-xs font-bold text-primary hover:underline underline-offset-4 decoration-primary/30 transition-all"
                  >
                    Khám phá chủ đề ngay
                  </Link>
                )}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-12 pb-16 border-t border-zinc-200/50 dark:border-white/5 pt-8 font-display">
                <button
                  disabled={isPending}
                  onClick={handleLoadMore}
                  className="group relative flex items-center justify-center gap-2.5 px-6 py-2.5 bg-primary/5 dark:bg-white/5 text-primary dark:text-white rounded-full font-bold text-[13px] border border-primary/20 dark:border-white/10 hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 active:scale-95 disabled:opacity-50 overflow-hidden shadow-sm hover:shadow-primary/30"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative z-10">Xem thêm bài viết</span>
                      <ArrowDown className="relative z-10 w-3.5 h-3.5 group-hover:translate-y-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="xl:hidden mt-4 pt-6 border-t border-zinc-200 dark:border-white/5 space-y-12">
              <TagList tags={popularTags} />
              <TrendingHorizontal articles={followedArticles} discoveryArticles={discoveryArticles} topicIds={topicIds} />
              {isLoggedIn && initialHistory && initialHistory.length > 0 && (
                <RecentHistory history={initialHistory} currentUserId={currentUsername ?? currentUserId} />
              )}
            </div>
          </div>
        </div>

        <aside className="hidden xl:block xl:col-span-3 shrink-0 xl:border-l xl:border-zinc-200 dark:xl:border-white/5 xl:pl-4">
          <div className="xl:sticky xl:top-[100px] space-y-14">
            <TagList tags={popularTags} />
            <TrendingSidebar articles={followedArticles} discoveryArticles={discoveryArticles} topicIds={topicIds} />
            {isLoggedIn && initialHistory && initialHistory.length > 0 && (
              <RecentHistory history={initialHistory} currentUserId={currentUsername ?? currentUserId} />
            )}
          </div>
        </aside>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-zinc-800 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Bookmark className="w-4 h-4 fill-current" />
          {toast.msg}
        </div>
      )}
    </section>
  );
}

function TrendingHorizontal({ articles, discoveryArticles, topicIds }: { articles: ArticleCard[]; discoveryArticles: ArticleCard[]; topicIds: string[] }) {
  const trending = useMemo(() => {
    // 1. Prioritize articles from followed topics
    let followedTrending = articles.filter(a => topicIds.includes(a.topic.id));
    
    // 2. If fewer than 5, backfill from discovery pool
    if (followedTrending.length < 5) {
      const followedSet = new Set(followedTrending.map(a => a.id));
      const fallbacks = [...discoveryArticles]
        .filter(a => !followedSet.has(a.id))
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5 - followedTrending.length);
      followedTrending = [...followedTrending, ...fallbacks];
    }

    return followedTrending.sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  }, [articles, discoveryArticles, topicIds]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-800 dark:text-white">Thịnh hành</h3>
      </div>
      <div className="flex flex-col">
        {trending.map((article, idx) => (
          <React.Fragment key={article.id}>
            <Link href={`/article/${article.slug}`} className="block group">
              <div className="cursor-pointer py-3 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-all duration-300 flex flex-row items-stretch min-h-[120px] px-3 -mx-3 rounded-xl">
                <div
                  className="w-24 sm:w-36 shrink-0 bg-cover bg-center relative rounded-lg overflow-hidden shadow-sm bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-300 dark:text-white/10 text-3xl font-bold"
                  style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
                >
                  {!article.thumbnail && article.title[0]}
                </div>
                <div className="pl-3 sm:pl-5 pr-1 flex-1 flex flex-col min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors font-display line-clamp-2 flex-1">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-auto text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{formatViews(article.viewCount)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            {idx < trending.length - 1 && <div className="h-px bg-zinc-100 dark:bg-white/5 w-full my-1" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function TrendingSidebar({ articles, discoveryArticles, topicIds }: { articles: ArticleCard[]; discoveryArticles: ArticleCard[]; topicIds: string[] }) {
  const trending = useMemo(() => {
    // Similarly, prioritize followed trending then backfill
    let list = articles.filter(a => topicIds.includes(a.topic.id));
    if (list.length < 4) {
      const listSet = new Set(list.map(a => a.id));
      const fallbacks = [...discoveryArticles]
        .filter(a => !listSet.has(a.id))
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 4 - list.length);
      list = [...list, ...fallbacks];
    }
    return list.sort((a, b) => b.viewCount - a.viewCount).slice(0, 4);
  }, [articles, discoveryArticles, topicIds]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Eye className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-800 dark:text-white">Thịnh hành</h3>
      </div>
      <div className="flex flex-col gap-1">
        {trending.map(article => (
          <Link href={`/article/${article.slug}`} key={article.id} className="block group">
            <div className="flex gap-3 p-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-all duration-300 rounded-xl">
              <div
                className="w-14 h-14 rounded-lg bg-cover bg-center shrink-0 border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-300 dark:text-white/20 font-bold text-lg"
                style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
              >
                {!article.thumbnail && article.title[0]}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h4 className="text-sm font-bold text-zinc-800 dark:text-white line-clamp-2 group-hover:text-primary transition-colors leading-tight mb-1.5">
                  {article.title}
                </h4>
                <div className="flex items-center gap-1 text-zinc-500">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">{formatViews(article.viewCount)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentHistory({ history, currentUserId }: { history: any[]; currentUserId?: string }) {
  const recent = history.slice(0, 3);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-800 dark:text-white">Lịch sử gần đây</h3>
        </div>
        <Link 
          href={`/profile/${currentUserId}?tab=history`}
          className="text-[10px] font-bold text-zinc-500 hover:text-primary transition-colors uppercase tracking-widest"
        >
          Tất cả
        </Link>
      </div>
      <div className="flex flex-col gap-5">
        {recent.map((item) => (
          <Link key={item.article.id} href={`/article/${item.article.slug}`} className="group block">
            <div className="flex gap-3">
              <div 
                className="w-12 h-12 shrink-0 rounded-lg bg-zinc-100 dark:bg-white/5 bg-cover bg-center overflow-hidden border border-zinc-200 dark:border-white/5"
                style={item.article.thumbnail ? { backgroundImage: `url('${item.article.thumbnail}')` } : undefined}
              />
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-white line-clamp-1 group-hover:text-primary transition-colors leading-snug">
                  {item.article.title}
                </h4>
                <div className="flex flex-col gap-1.5 mt-1.5">
                  <div className="w-full h-0.5 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500 dark:text-slate-500 uppercase tracking-tighter">
                    Đã đọc {Math.round(item.progress * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
