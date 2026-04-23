'use client';

import React, { useState, useMemo, useRef, useTransition, useCallback, useEffect } from 'react';
import { Heart, MessageCircle, LayoutGrid, Clock, Eye, Loader2, Bookmark, ChevronRight, ArrowDown, Star, Lock, Tag, Filter, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import TagList from './TagList';
import { GlanceTrigger } from './GlancePreview';
import type { ArticleCard } from '@/features/articles/actions/article';
import { getArticlesAction, getForYouArticlesAction } from '@/features/articles/actions/article';
import { toggleBookmarkAction, getBookmarksAction } from '@/features/articles/actions/bookmark';
import type { TopicItem } from '@/features/admin/actions/topic';
import ArticleListItem from '@/features/articles/components/ArticleListItem';

function formatViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
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
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [isExpandedTopics, setIsExpandedTopics] = useState(false);
  const timeframeRef = useRef<HTMLDivElement>(null);

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
      <div className="flex flex-col lg:flex-row xl:grid xl:grid-cols-12 2xl:grid-cols-12 gap-10 items-stretch">
        
        {/* Sidebar Topics */}
        <aside className="lg:w-52 xl:col-span-2 2xl:col-span-2 shrink-0 relative">
          <div className="lg:sticky lg:top-[100px]">

            <div className="flex items-center gap-2 mb-3 lg:mb-4 px-2">
              <LayoutGrid className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-800 dark:text-white">Chủ đề của bạn</h3>
            </div>

            {/* Mobile: wrap chips — giống phần Thẻ phổ biến bên dưới */}
            <nav className="lg:hidden pb-4">
              <div className="flex flex-wrap gap-2 px-1">
                {topics.length > 0 ? (isExpandedTopics ? topics : topics.slice(0, 10)).map(t => (
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
                  </Link>
                )) : null}
                {topics.length > 10 && (
                  <button
                    onClick={() => setIsExpandedTopics(!isExpandedTopics)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-zinc-600 dark:text-slate-400 hover:border-primary/30 hover:text-primary transition-all shadow-sm active:scale-95"
                  >
                    {isExpandedTopics ? 'Thu gọn' : `+ ${topics.length - 10} chủ đề khác`}
                  </button>
                )}
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
                (isExpandedTopics ? topics : topics.slice(0, 10)).map(t => {
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
                      <div className="flex items-center flex-wrap gap-1.5 flex-1 pr-2">
                        <span className="break-words leading-snug">{t.label}</span>
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
              {topics.length > 10 && (
                <button
                  onClick={() => setIsExpandedTopics(!isExpandedTopics)}
                  className="mt-1 px-3 py-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/5 transition-all flex items-center gap-2 group w-fit"
                >
                  {isExpandedTopics ? 'Thu gọn danh sách' : `+ ${topics.length - 10} chủ đề khác`}
                </button>
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
        <div className="flex-1 xl:col-span-7 2xl:col-span-7">
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

               {/* Glassmorphism Dropdown Menu */}
               {isTimeframeOpen && (
                 <div className="absolute right-0 top-full mt-3 w-56 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 py-2.5 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 dark:ring-white/5">
                    <div className="px-4 py-2 mb-1 border-b border-zinc-100 dark:border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Lọc theo thời gian</span>
                    </div>
                    {timeframeOptions.map(o => (
                      <button
                        key={o.id}
                        onClick={() => handleTimeframeChange(o.id)}
                        className={`w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-between group/link ${
                          activeTimeframe === o.id ? 'text-primary' : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-50/50 dark:hover:bg-white/5'
                        }`}
                      >
                        {o.label}
                        {activeTimeframe === o.id && <div className="w-1 h-1 rounded-full bg-primary" />}
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
                  <ArticleListItem 
                    article={article}
                    isBookmarked={bookmarked.get(article.id)}
                    onBookmark={handleBookmark}
                  />
                  {idx < currentArticles.length - 1 && <div className="h-px bg-zinc-100 dark:bg-white/5 w-full my-2 sm:my-3 lg:my-4" />}
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

        <aside className="hidden xl:block xl:col-span-3 2xl:col-span-3 shrink-0 xl:border-l xl:border-zinc-200 dark:xl:border-white/5 xl:pl-4">
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
            <GlanceTrigger article={article} className="relative group">
              <Link 
                href={`/article/${article.slug}`} 
                className="absolute inset-0 z-20 cursor-pointer" 
                aria-label={article.title}
              />
              <div className="py-3 hover:bg-zinc-100/80 dark:hover:bg-white/[0.02] transition-all duration-500 ease-[cubic-bezier(0.34,1,0.64,1)] flex flex-row items-stretch min-h-[120px] px-3 -mx-3 rounded-xl relative cursor-pointer group-hover:translate-x-1 group-hover:shadow-2xl group-hover:shadow-primary/5">
                <div className="absolute -left-1 top-2 text-4xl font-black text-zinc-100 dark:text-white/[0.02] italic select-none z-0 group-hover:text-primary/20 transition-colors duration-500">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="w-24 sm:w-28 h-auto rounded-lg bg-cover bg-center shrink-0 border border-zinc-200 dark:border-white/5 relative z-10 overflow-hidden shadow-sm bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-300 dark:text-white/20 font-bold text-2xl"
                  style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
                >
                  {!article.thumbnail && article.title[0]}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none z-10 overflow-hidden">
                    <div 
                      className="absolute inset-0 w-full h-full bg-white/20 blur-[20px] -skew-x-[20deg]"
                      style={{ animation: 'shimmer-sweep 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center ml-4 relative z-10">
                  <span className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1 opacity-80">{article.topic.label}</span>
                  <h4 className="text-sm sm:text-[15px] font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-3 text-zinc-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{article.readTime}p</span>
                    </span>
                    <span className="flex items-center gap-1 group/stat transition-colors hover:text-rose-500">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{article._count.likes}</span>
                    </span>
                    <span className="flex items-center gap-1 group/stat transition-colors hover:text-primary">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{article._count.comments}</span>
                    </span>
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{formatViews(article.viewCount)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </GlanceTrigger>
            {idx < trending.length - 1 && <div className="h-px bg-zinc-100 dark:bg-white/5 w-full my-1" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function TrendingSidebar({ articles, discoveryArticles, topicIds }: { articles: ArticleCard[]; discoveryArticles: ArticleCard[]; topicIds: string[] }) {
  const trending = useMemo(() => {
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
          <GlanceTrigger key={article.id} article={article} className="relative group">
            <Link 
              href={`/article/${article.slug}`} 
              className="absolute inset-0 z-20 cursor-pointer" 
              aria-label={article.title}
            />
            <div className="flex gap-4 p-2.5 hover:bg-zinc-100/80 dark:hover:bg-white/[0.02] transition-all duration-300 rounded-xl relative cursor-pointer group-hover:translate-x-1 group-hover:shadow-lg group-hover:shadow-primary/5">
               <div className="absolute -left-1 -top-1 w-6 h-6 flex items-center justify-center text-[10px] font-black italic text-primary/40 dark:text-white/10 select-none group-hover:text-primary transition-colors duration-300">
                  {String(trending.indexOf(article) + 1).padStart(2, '0')}
               </div>
              <div
                className="w-14 h-14 rounded-lg bg-cover bg-center shrink-0 border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-300 dark:text-white/20 font-bold text-lg relative"
                style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
              >
                {!article.thumbnail && article.title[0]}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none z-10 overflow-hidden">
                  <div 
                    className="absolute inset-0 w-full h-full bg-white/20 blur-[20px] -skew-x-[20deg]"
                    style={{ animation: 'shimmer-sweep 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-0.5 relative z-10 pointer-events-auto">
                <h4 className="text-sm font-bold text-zinc-800 dark:text-white line-clamp-2 group-hover:text-primary transition-colors leading-tight mb-1.5">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 text-zinc-500">
                  <div className="flex items-center relative z-20">
                    <Link 
                      href={`/profile/${article.author.username || article.author.id}`}
                      className="text-[10px] font-semibold text-zinc-600 dark:text-slate-400 truncate max-w-[90px] hover:text-primary transition-colors"
                    >
                      <span className="font-normal opacity-70">bởi</span> {article.author.name}
                    </Link>
                  </div>
                  <span className="text-[10px] opacity-40">•</span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    <span className="text-[10px] font-semibold">{article._count.likes}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span className="text-[10px] font-semibold">{article._count.comments}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span className="text-[10px] font-semibold">{formatViews(article.viewCount)}</span>
                  </span>
                </div>
              </div>
            </div>
          </GlanceTrigger>
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
          <Link key={item.article.id} href={`/article/${item.article.slug}`} className="group block -mx-2 px-2 py-2 rounded-xl transition-all duration-300 hover:bg-zinc-100/50 dark:hover:bg-white/[0.03]">
            <div className="flex gap-3">
              <div 
                className="w-12 h-12 shrink-0 rounded-lg bg-zinc-100 dark:bg-white/5 bg-cover bg-center overflow-hidden border border-zinc-200 dark:border-white/5 transition-transform duration-300 group-hover:scale-110"
                style={item.article.thumbnail ? { backgroundImage: `url('${item.article.thumbnail}')` } : undefined}
              />
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-white line-clamp-1 group-hover:text-primary transition-colors leading-snug">
                  {item.article.title}
                </h4>
                <div className="flex flex-col gap-1.5 mt-1.5">
                  <div className="w-full h-0.5 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full group-hover:bg-indigo-500 transition-colors duration-300" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500 dark:text-slate-500 uppercase tracking-tighter group-hover:text-primary/70 transition-colors">
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
