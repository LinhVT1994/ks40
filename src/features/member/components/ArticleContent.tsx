'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bookmark, Sparkles, Lock as LockIcon, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleLikeAction } from '@/features/articles/actions/like';
import { toggleBookmarkAction } from '@/features/articles/actions/bookmark';
import { upsertReadHistoryAction, markArticleOpenedAction } from '@/features/articles/actions/read-history';
import { incrementViewAction } from '@/features/articles/actions/article';
import MarkdownViewer from '@/components/shared/MarkdownViewer';
import { useInteractionOptional } from '@/features/articles/context/ArticleInteractionContext';
import ShareMenu from '@/components/shared/ShareMenu';
import ArticleAnnotationLayer from '@/features/articles/components/ArticleAnnotationLayer';
import { type ArticleAnnotation } from '@/features/articles/actions/annotation';

interface ArticleContentProps {
  articleId: string;
  content: string;
  overview?: string;
  objectives?: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isGated?: boolean;
  isPreview?: boolean;
  audience?: string;
  articleTitle?: string;
  initialAnnotations?: ArticleAnnotation[];
  authorAnnotations?: ArticleAnnotation[];
  isAuthor?: boolean;
}

import { useNotes } from '@/context/NotesContext';

export default function ArticleContent({
  articleId, content, overview, objectives,
  likeCount, commentCount, isLiked, isBookmarked,
  isGated = false, isPreview = false, audience,
  articleTitle = '',
  initialAnnotations = [],
  authorAnnotations = [],
  isAuthor = false,
}: ArticleContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { setCurrentArticle } = useNotes();

  // Sync Global Context with current Article
  useEffect(() => {
    setCurrentArticle(articleId, articleTitle);
    return () => setCurrentArticle(null, null);
  }, [articleId, articleTitle, setCurrentArticle]);

  // Resizing and Interaction logic removed as parts were moved to global components, 
  // but we keep the interaction hook for Like/Bookmark functionality.
  const interaction = useInteractionOptional();
  
  const liked = interaction?.liked ?? false;
  const bookmarked = interaction?.bookmarked ?? false;
  const likes = interaction?.likes ?? likeCount;
  const handleLike = interaction?.handleLike ?? (() => {});
  const handleBookmark = interaction?.handleBookmark ?? (() => {});
  const bookmarkToast = interaction?.bookmarkToast ?? null;
  const setReadProgress = interaction?.setReadProgress ?? (() => {});
  const readProgress = interaction?.readProgress ?? 0;
  const likePending = interaction?.likePending ?? false;
  const bookmarkPending = interaction?.bookmarkPending ?? false;

  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const lastSavedRef = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isPreview) return;
    // Tăng view — dedup 24h theo articleId trong localStorage
    const key = `viewed:${articleId}`;
    const last = Number(localStorage.getItem(key) ?? 0);
    if (Date.now() - last > 24 * 60 * 60 * 1000) {
      incrementViewAction(articleId);
      localStorage.setItem(key, String(Date.now()));
    }
  }, [articleId]);

  useEffect(() => {
    if (isPreview) return;
    // Ghi nhận đã mở bài — KHÔNG đụng progress nếu đã có, đồng thời sync ref với DB
    let cancelled = false;
    markArticleOpenedAction(articleId).then(({ progress }) => {
      if (cancelled) return;
      lastSavedRef.current = Math.max(lastSavedRef.current, progress);
      progressRef.current  = Math.max(progressRef.current, progress);
      setReadProgress(Math.max(0, progress));
    });

    // Chỉ ghi khi tiến thêm ≥5% so với lần lưu trước (không bao giờ lùi)
    const save = (p: number, force = false) => {
      if (p <= lastSavedRef.current) return;
      if (!force && p - lastSavedRef.current < 0.05 && p < 0.95) return;
      lastSavedRef.current = p;
      upsertReadHistoryAction(articleId, p);
    };

    const onScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (-top + window.innerHeight * 0.6) / height));
      progressRef.current = Math.max(progressRef.current, p); // không lùi
      setReadProgress(progressRef.current);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(progressRef.current), 3000);
    };

    // Khi user switch tab / minimize → save ngay, không đợi debounce
    const onVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(saveTimer.current);
        save(progressRef.current, true);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearTimeout(saveTimer.current);
      // force save progress cuối khi unmount (navigate sang trang khác)
      save(progressRef.current, true);
    };
  }, [articleId]);

  return (
    <div ref={contentRef} className="w-full min-w-0 max-w-none">
      {/* Reading progress bar — fixed top */}
      <div aria-hidden="true" className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-primary via-indigo-500 to-primary transition-[width] duration-300 ease-out relative shadow-[0_0_4px_rgba(59,130,246,0.3)]"
          style={{ width: `${Math.min(100, readProgress * 100)}%` }}
        >
          {/* Subtle Leading Glow */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-full bg-white blur-[2px] opacity-40" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-full bg-white shadow-[0_0_5px_#fff] opacity-60" />
        </div>
      </div>
      <ArticleAnnotationLayer
        articleId={articleId}
        initialAnnotations={initialAnnotations}
        authorAnnotations={authorAnnotations}
        isAuthor={isAuthor}
      >
        <div data-article-content>
          {overview && (
            <div className="w-full max-w-[720px] mx-auto px-4 md:px-0">
          <div className="relative overflow-hidden px-0 py-2 mb-8 group">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <h2 data-annotation-target className="font-bold text-2xl md:text-3xl text-zinc-900 dark:text-slate-200">Tóm tắt nhanh</h2>
                </div>
                  
                <div className="text-zinc-800 dark:text-slate-400 text-lg md:text-xl font-medium tracking-tight">
                  <MarkdownViewer content={overview} compact />
                </div>
              </div>
          </div>
        </div>
      )}

      {objectives && (
        <div className="w-full max-w-[720px] mx-auto px-4 md:px-0">
          <div className="relative overflow-hidden px-0 py-2 mb-12 group">
            {/* Background Decorative Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            
              <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h2 data-annotation-target className="font-bold text-2xl md:text-3xl text-zinc-900 dark:text-slate-200">Mục tiêu bài đọc</h2>
                <p data-annotation-target className="text-zinc-600 dark:text-slate-500 text-lg md:text-xl font-medium">Sau khi đọc xong bài này, bạn sẽ:</p>
              </div>

                <div className="max-w-none 
                  [&_ul]:list-none [&_ul]:p-0 [&_ul]:m-0 [&_ul]:space-y-4
                  [&_li]:relative [&_li]:pl-6
                  [&_li]:text-zinc-700 dark:[&_li]:text-slate-400
                  [&_li]:text-lg md:[&_li]:text-xl font-medium tracking-tight
                  [&_li]:before:content-[''] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.65em]
                  [&_li]:before:w-1.5 [&_li]:before:h-1.5 [&_li]:before:rounded-full [&_li]:before:bg-primary
                  [&_li]:before:shrink-0"
                >
                  <div className="markdown-content">
                    <MarkdownViewer content={objectives} />
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}

      {objectives && (
        <div className="w-full max-w-[720px] mx-auto px-4 md:px-0 mb-12">
          <div className="w-full h-px bg-zinc-200 dark:bg-white/10" />
        </div>
      )}

          {/* Content — markdown */}
          {!isGated ? (
            <div className="relative">
              <MarkdownViewer content={content} />
            </div>
          ) : (
            // Gated: Integrated design (No Card)
            <div className="relative max-w-[816px] mx-auto">
              <div className="pb-64">
                <MarkdownViewer content={content} />
              </div>

          {/* Premium Progressive Blur Overlay — Gradual transition */}
          <div className="absolute inset-x-0 bottom-0 h-[600px] flex flex-col items-center justify-center pointer-events-none overflow-hidden">
            {/* Layered Progressive Blurs */}
            <div className="absolute inset-0 flex flex-col">
              <div className="h-1/5 bg-gradient-to-b from-transparent to-zinc-50/10 dark:to-slate-950/10 backdrop-blur-[1px]" />
              <div className="h-1/5 bg-gradient-to-b from-zinc-50/10 to-zinc-50/30 dark:from-slate-950/10 dark:to-slate-950/30 backdrop-blur-[2px]" />
              <div className="h-1/5 bg-gradient-to-b from-zinc-50/30 to-zinc-50/60 dark:from-slate-950/30 dark:to-slate-950/60 backdrop-blur-[4px]" />
              <div className="h-1/5 bg-gradient-to-b from-zinc-50/60 to-zinc-50/90 dark:from-slate-950/60 dark:to-slate-950/90 backdrop-blur-[8px]" />
              <div className="h-1/5 bg-zinc-50/95 dark:bg-slate-950/95 backdrop-blur-[16px]" />
            </div>
            
            {/* Final smooth gradient overlay to blend perfectly */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-slate-950 via-zinc-50/80 dark:via-slate-950/80 via-40% to-transparent" />
            
            {/* Direct Message Layout (No Card) */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 pointer-events-auto">
              {/* Text Content */}
              <div className="max-w-[420px] space-y-4">
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-slate-200 tracking-tight leading-tight">
                  {!session ? 'Đăng nhập để đọc tiếp' : audience === 'PREMIUM' ? 'Mở khóa Premium' : 'Gia nhập Hội viên'}
                </h3>
                <p className="text-zinc-600 dark:text-slate-500 leading-relaxed font-medium text-base sm:text-lg">
                  {!session 
                    ? 'Tham gia cùng cộng đồng để tiếp tục khám phá các phân tích chuyên sâu và kinh nghiệm thực chiến.'
                    : audience === 'PREMIUM' 
                      ? 'Nâng cấp Premium để mở khóa bài viết này cùng kho tàng tài liệu độc quyền.'
                      : 'Nội dung này được dành riêng cho các thành viên chính thức của chúng tôi.'
                  }
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-[400px]">
                {!session ? (
                  <>
                    <a
                      href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                      className="w-full h-14 flex items-center justify-center bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-xl active:scale-95"
                    >
                      Đăng nhập ngay
                    </a>
                    <a
                      href="/register"
                      className="w-full h-14 flex items-center justify-center bg-transparent text-zinc-500 dark:text-slate-400 font-bold rounded-2xl border border-zinc-300 dark:border-white/10 hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-all active:scale-95 text-sm"
                    >
                      Đăng ký miễn phí
                    </a>
                  </>
                ) : (
                  <a
                    href={audience === 'PREMIUM' ? '/pricing' : '#'}
                    className={`w-full h-14 flex items-center justify-center rounded-2xl font-bold text-white shadow-2xl transition-all active:scale-95 ${audience === 'PREMIUM' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
                  >
                    {audience === 'PREMIUM' ? 'Nâng cấp ngay' : 'Đăng ký Hội viên'}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </ArticleAnnotationLayer>

  {/* Bookmark toast */}
  {bookmarkToast && (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-zinc-800 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <Bookmark className="w-4 h-4 fill-current" />
      {bookmarkToast}
    </div>
  )}
</div>
);
}
