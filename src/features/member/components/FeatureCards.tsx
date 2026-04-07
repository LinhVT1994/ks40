'use client';

import React, { useState, useMemo, useEffect, useRef, useTransition, useCallback } from 'react';
import { Heart, MessageCircle, Calendar, Tag, Sparkles, LayoutGrid, Clock, Eye, Loader2, Bookmark, Star, Lock, ChevronRight, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import TagList from './TagList';
import type { ArticleCard } from '@/features/articles/actions/article';
import { getArticlesAction, getForYouArticlesAction } from '@/features/articles/actions/article';
import { toggleBookmarkAction } from '@/features/articles/actions/bookmark';
import { ArticleCategory } from '@prisma/client';

type CategoryConfig = { value: string; label: string; emoji: string; color: string; enabled: boolean };

const DEFAULT_CATEGORY_CONFIG: CategoryConfig[] = [
  { value: 'SYSTEM_DESIGN', label: 'System Design', emoji: '🏗️', color: '#8b5cf6', enabled: true },
  { value: 'AI_ML',         label: 'AI / ML',        emoji: '🤖', color: '#f59e0b', enabled: true },
  { value: 'DEVOPS',        label: 'DevOps',          emoji: '⚙️', color: '#10b981', enabled: true },
  { value: 'BLOCKCHAIN',    label: 'Blockchain',      emoji: '🔗', color: '#eab308', enabled: true },
  { value: 'FRONTEND',      label: 'Frontend',        emoji: '🎨', color: '#ec4899', enabled: true },
  { value: 'BACKEND',       label: 'Backend',         emoji: '🔧', color: '#3b82f6', enabled: true },
  { value: 'OTHER',         label: 'Khác',            emoji: '📚', color: '#64748b', enabled: true },
];

const BADGE_LABELS: Record<string, string> = {
  HOT:      'Hot',
  NEW:      'New',
  TRENDING: 'Trending',
  FEATURED: 'Featured',
};

function formatDate(date: Date | null) {
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

function formatViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const LIMIT = 20;

export default function FeatureCards({
  initialArticles,
  totalPages,
  isLoggedIn,
  popularTags,
  categoryConfig: categoryConfigProp,
}: {
  initialArticles: ArticleCard[];
  totalPages: number;
  isLoggedIn: boolean;
  popularTags: { id: string; name: string; slug: string; count: number }[];
  categoryConfig?: CategoryConfig[] | null;
}) {
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'ALL'>('ALL');
  const [activeFeed,       setActiveFeed]        = useState<'all' | 'for-you'>('all');
  const [articles,         setArticles]           = useState(initialArticles);
  const [forYouArticles,   setForYouArticles]     = useState<ArticleCard[]>([]);
  const [forYouLoaded,     setForYouLoaded]       = useState(false);
  const [page,             setPage]               = useState(1);
  const [hasMore,          setHasMore]            = useState(1 < totalPages);
  const [isPending,        startTransition]       = useTransition();
  const topRef = useRef<HTMLDivElement>(null);
  
  // bookmark state: overlay trên initialArticles
  const [bookmarked, setBookmarked] = useState<Map<string, boolean>>(() => {
    const m = new Map<string, boolean>();
    initialArticles.forEach(a => { if (a.isBookmarked) m.set(a.id, true); });
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
    if (page >= totalPages || isPending) return;
    
    startTransition(async () => {
      const nextPage = page + 1;
      const cat = selectedCategory === 'ALL' ? undefined : selectedCategory;
      const { articles: more } = await getArticlesAction({
        category: cat,
        limit:    LIMIT,
        page:     nextPage,
      });
      setArticles(prev => [...prev, ...more]);
      setPage(nextPage);
      setHasMore(nextPage < totalPages);
    });
  }, [page, totalPages, isPending, selectedCategory]);

  // Refetch khi đổi category
  useEffect(() => {
    const isFirstMount = !articles.length;
    if (isFirstMount) return;
    
    startTransition(async () => {
      const cat = selectedCategory === 'ALL' ? undefined : selectedCategory;
      const { articles: fresh, totalPages: tp } = await getArticlesAction({
        category: cat,
        limit:    LIMIT,
        page:     1,
      });
      setArticles(fresh);
      setPage(1);
      setHasMore(1 < tp);
    });
  }, [selectedCategory]);

  // Fetch for-you khi chuyển tab (lazy, chỉ 1 lần)
  useEffect(() => {
    if (activeFeed !== 'for-you' || forYouLoaded) return;
    startTransition(async () => {
      const result = await getForYouArticlesAction(20);
      setForYouArticles(result);
      setForYouLoaded(true);
    });
  }, [activeFeed, forYouLoaded]);

  const catConfig = categoryConfigProp ?? DEFAULT_CATEGORY_CONFIG;
  const catMap = Object.fromEntries(catConfig.map(c => [c.value, c]));
  const getCatLabel = (val: string) => {
    const c = catMap[val];
    return c ? c.label : val;
  };

  const categories = useMemo(() => {
    const used = new Set(initialArticles.map(a => a.category));
    const ordered = catConfig
      .filter(c => c.enabled && used.has(c.value as ArticleCategory))
      .map(c => c.value as ArticleCategory);
    return ['ALL' as const, ...ordered];
  }, [initialArticles, catConfig]);

  const filtered = useMemo(() => {
    if (activeFeed === 'for-you') return forYouArticles;
    return articles;
  }, [articles, forYouArticles, activeFeed]);

  return (
    <section ref={topRef} className="mt-10 sm:mt-16 lg:mt-[88px] overflow-visible">
      {/* Feed Tabs — Only show for logged in users */}
      {isLoggedIn && (
        <div className="flex flex-row items-center justify-start gap-6 mb-10">
          <div className="hidden xl:block w-[16.666%] text-slate-400 font-display font-medium text-[11px] uppercase tracking-widest pl-1">
            Lọc theo khám phá
          </div>
          <div className="flex items-center gap-8 border-b border-slate-100 dark:border-white/5 w-fit">
            {([
              ['all', LayoutGrid, 'Toàn bộ'],
              ['for-you', Sparkles, 'Gợi ý cho bạn']
            ] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setActiveFeed(key)}
                className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all relative group ${
                  activeFeed === key ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeFeed === key ? 'text-primary' : 'text-slate-400'}`} />
                <span>{label}</span>
                {activeFeed === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row xl:grid xl:grid-cols-12 gap-10 items-stretch">
        {/* Sidebar Filter */}
        <aside className="lg:w-52 xl:col-span-2 shrink-0 relative">
          <div className="lg:sticky lg:top-[100px]">
            <div className="mb-6 text-slate-900 dark:text-white">
              <h3 className="font-display font-bold text-lg">Danh mục</h3>
            </div>
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-left whitespace-nowrap lg:whitespace-normal flex items-center justify-between border ${
                    selectedCategory === cat
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-transparent'
                  }`}
                >
                  <span>{cat === 'ALL' ? 'Tất cả' : getCatLabel(cat)}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Card List */}
        <div className="flex-1 xl:col-span-7">
          <div className="flex flex-col">
            {filtered.length > 0 ? (
              filtered.map((article, idx) => (
                <React.Fragment key={article.id}>
                  <Link href={`/article/${article.slug}`} className="block group">
                    <div className="cursor-pointer py-3 sm:py-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all duration-300 flex flex-row items-stretch min-h-[120px] sm:min-h-[150px] px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-xl">
                      {/* Thumbnail */}
                      <div
                        className="w-24 sm:w-36 md:w-40 shrink-0 bg-cover bg-center relative rounded-lg overflow-hidden transition-transform duration-700 group-hover:scale-[1.02] shadow-sm bg-slate-100 dark:bg-white/5"
                        style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
                      >
                        {!article.thumbnail && (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-white/10 text-3xl sm:text-4xl font-bold">
                            {article.title[0]}
                          </div>
                        )}
                        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 z-20">
                          {article.badges.slice(0, 1).map(b => (
                            <span key={b} className="bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 text-slate-900 dark:text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase shadow-sm">
                              {BADGE_LABELS[b] ?? b}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="pl-3 sm:pl-5 pr-1 pt-0 pb-1 flex-1 flex flex-col relative z-10 transition-transform duration-300 group-hover:translate-x-0.5 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors font-display line-clamp-2 sm:line-clamp-1 flex-1">
                            {article.title}
                          </h4>
                          <div className="shrink-0 hidden sm:flex items-center gap-1 mt-0.5">
                            {article.audience === 'PREMIUM' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-500/20">
                                <Star className="w-2 h-2 fill-current" /> Premium
                              </span>
                            )}
                            {article.audience === 'MEMBERS' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-500/20">
                                <Lock className="w-2 h-2" /> Members
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[8px] font-bold uppercase tracking-wider border border-slate-200 dark:border-white/5 transition-colors group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20">
                              <Tag className="w-2 h-2" />
                              {getCatLabel(article.category)}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] sm:text-[12px] md:text-[13px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 sm:line-clamp-2 leading-relaxed flex-1 hidden xs:block">
                          {article.summary}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="flex items-center gap-1 sm:gap-1.5 text-slate-400">
                              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="text-[11px] sm:text-xs font-medium">{article._count.likes}</span>
                            </span>
                            <span className="flex items-center gap-1 sm:gap-1.5 text-slate-400">
                              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="text-[11px] sm:text-xs font-medium">{article._count.comments}</span>
                            </span>
                            <span className="hidden sm:flex items-center gap-1.5 text-slate-400">
                              <Eye className="w-4 h-4" />
                              <span className="text-xs font-medium">{formatViews(article.viewCount)}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="text-[10px] font-medium">{article.readTime}p</span>
                            </span>
                            <span className="hidden sm:flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-medium uppercase tracking-wider">{formatDate(article.publishedAt)}</span>
                            </span>
                            <button
                              onClick={(e) => handleBookmark(e, article.id)}
                              className={`p-1 rounded-lg transition-all ${bookmarked.get(article.id) ? 'text-primary' : 'text-slate-300 hover:text-primary dark:text-white/20 dark:hover:text-primary'}`}
                              title={bookmarked.get(article.id) ? 'Bỏ lưu' : 'Lưu bài viết'}
                            >
                              <Bookmark className={`w-3.5 h-3.5 transition-all ${bookmarked.get(article.id) ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  {idx < filtered.length - 1 && <div className="h-px bg-slate-100 dark:bg-white/5 w-full my-1.5" />}
                </React.Fragment>
              ))
            ) : (
              <div className="py-20 text-center bg-white/50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                <p className="text-slate-500 dark:text-slate-400">Không tìm thấy bài viết nào.</p>
              </div>
            )}

            {/* Premium Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-12 pb-16 border-t border-slate-100/50 dark:border-white/5 pt-8 font-display">
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

            {/* Trending — cuối danh sách, chỉ trên mobile/tablet */}
            <div className="xl:hidden mt-4 pt-6 border-t border-slate-100 dark:border-white/5 space-y-12">
              <TagList tags={popularTags} />
              <TrendingHorizontal articles={articles} />
            </div>
          </div>
        </div>

        {/* Trending Sidebar — chỉ hiện trên xl */}
        <aside className="hidden xl:block xl:col-span-3 shrink-0 xl:border-l xl:border-slate-100 dark:xl:border-white/5 xl:pl-4">
          <div className="xl:sticky xl:top-[100px] space-y-14">
            <TagList tags={popularTags} />
            <TrendingSidebar articles={articles} />
          </div>
        </aside>
      </div>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Bookmark className="w-4 h-4 fill-current" />
          {toast.msg}
        </div>
      )}
    </section>
  );
}

function TrendingHorizontal({ articles }: { articles: ArticleCard[] }) {
  const trending = useMemo(
    () => [...articles].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5),
    [articles],
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">Xem nhiều nhất</h3>
      </div>
      <div className="flex flex-col">
        {trending.map((article, idx) => (
          <React.Fragment key={article.id}>
            <Link href={`/article/${article.slug}`} className="block group">
              <div className="cursor-pointer py-3 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all duration-300 flex flex-row items-stretch min-h-[120px] px-3 -mx-3 rounded-xl">
                <div
                  className="w-24 sm:w-36 shrink-0 bg-cover bg-center relative rounded-lg overflow-hidden shadow-sm bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-white/10 text-3xl font-bold"
                  style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
                >
                  {!article.thumbnail && article.title[0]}
                </div>
                <div className="pl-3 sm:pl-5 pr-1 flex-1 flex flex-col min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors font-display line-clamp-2 flex-1">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-auto text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{formatViews(article.viewCount)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{article._count.likes}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-medium">{article.readTime}p</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            {idx < trending.length - 1 && <div className="h-px bg-slate-100 dark:bg-white/5 w-full my-1" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function TrendingSidebar({ articles }: { articles: ArticleCard[] }) {
  const trending = useMemo(
    () => [...articles].sort((a, b) => b.viewCount - a.viewCount).slice(0, 4),
    [articles],
  );

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Eye className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">Xem nhiều nhất</h3>
      </div>
      <div className="flex flex-col gap-1">
        {trending.map(article => (
          <Link href={`/article/${article.slug}`} key={article.id} className="block group">
            <div className="flex gap-3 p-2 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all duration-300 rounded-xl">
              <div
                className="w-14 h-14 rounded-lg bg-cover bg-center shrink-0 border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-white/20 font-bold text-lg"
                style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
              >
                {!article.thumbnail && article.title[0]}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors leading-tight mb-1.5">
                  {article.title}
                </h4>
                <div className="flex items-center gap-1 text-slate-400">
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
