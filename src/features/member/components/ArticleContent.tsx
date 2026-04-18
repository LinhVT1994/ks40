'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bookmark, Sparkles, Target, Lock as LockIcon } from 'lucide-react';
import { toggleLikeAction } from '@/features/articles/actions/like';
import { toggleBookmarkAction } from '@/features/articles/actions/bookmark';
import { upsertReadHistoryAction, markArticleOpenedAction } from '@/features/articles/actions/read-history';
import { incrementViewAction } from '@/features/articles/actions/article';
import MarkdownViewer from '@/components/shared/MarkdownViewer';
import { useInteraction } from '@/features/articles/context/ArticleInteractionContext';
import ShareMenu from '@/components/shared/ShareMenu';

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
}

export default function ArticleContent({
  articleId, content, overview, objectives,
  likeCount, commentCount, isLiked, isBookmarked,
  isGated = false, isPreview = false, audience,
}: ArticleContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const { 
    liked, bookmarked, likes, 
    handleLike, handleBookmark, bookmarkToast, setReadProgress,
    readProgress, likePending, bookmarkPending
  } = useInteraction();

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
      <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-transparent pointer-events-none">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${readProgress * 100}%` }}
        />
      </div>
      {overview && (
        <div className="w-full max-w-[720px] mx-auto">
          <div className="bg-primary/[0.03] dark:bg-primary/[0.01] border border-primary/10 dark:border-white/5 p-6 rounded-2xl mb-10 relative group transition-all duration-500 shadow-sm hover:shadow-md">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <h3 className="font-bold text-[10px] uppercase tracking-[0.2em]">Tóm tắt nội dung</h3>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg font-medium italic opacity-90">
                "{overview}"
              </p>
            </div>
          </div>
        </div>
      )}

      {objectives && (
        <div className="w-full max-w-[720px] mx-auto">
          <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] border border-emerald-500/10 dark:border-emerald-500/5 p-6 rounded-2xl mb-16 relative group transition-all duration-500 shadow-sm hover:shadow-md">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Target className="w-3.5 h-3.5" />
                <h3 className="font-bold text-[10px] uppercase tracking-[0.2em]">Mục tiêu bài học</h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none
                prose-p:mt-0 prose-ul:mt-0
                prose-ul:space-y-1 prose-li:text-zinc-700 dark:prose-li:text-zinc-300
                prose-li:marker:text-emerald-500/40 prose-li:text-base prose-li:font-medium">
                <MarkdownViewer content={objectives} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content — markdown */}
      {!isGated ? (
        // User has full access: show complete content
        <MarkdownViewer content={content} />
      ) : (
        // Gated: content is already truncated to 50% by the server action
        <div className="relative">
          <div className="pb-40">
            <MarkdownViewer content={content} />
          </div>

          {/* Bottom-aligned Gate Overlay with smooth fade */}
          <div className="absolute inset-x-0 bottom-0 h-[400px] bg-gradient-to-t from-zinc-50 dark:from-slate-950 via-zinc-50/98 dark:via-slate-950/98 via-40% to-transparent flex flex-col items-center justify-end pb-16 px-6 text-center">
            <div className="max-w-md w-full p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] border border-zinc-200/50 dark:border-white/5 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Icon */}
              <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center shadow-2xl rotate-3 transition-transform hover:rotate-0 duration-500 ${audience === 'PREMIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                {audience === 'PREMIUM' ? <Sparkles className="w-8 h-8" /> : <LockIcon className="w-8 h-8" />}
              </div>

              {/* Text */}
              <div className="space-y-3">
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {!session ? 'Bắt đầu hành trình của bạn' : audience === 'PREMIUM' ? 'Nội dung đặc quyền' : 'Khu vực thành viên'}
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                  {!session 
                    ? 'Đăng ký tài khoản để mở khóa toàn bộ kiến thức chuyên sâu và tài liệu thực hành đi kèm.'
                    : audience === 'PREMIUM' 
                      ? 'Nâng cấp lên gói Premium để truy cập nội dung này cùng hệ sinh thái bài giảng độc quyền.'
                      : 'Nội dung này dành riêng cho cộng đồng học viên chính thức.'
                  }
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                {!session ? (
                  <>
                    <a
                      href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                      className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-[0.98]"
                    >
                      Đăng nhập ngay
                    </a>
                    <a
                      href="/register"
                      className="w-full py-4 bg-zinc-50 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl border border-zinc-200 dark:border-white/10 hover:border-primary/40 hover:text-primary transition-all active:scale-[0.98]"
                    >
                      Tạo tài khoản miễn phí
                    </a>
                  </>
                ) : (
                  <a
                    href={audience === 'PREMIUM' ? '/pricing' : '#'}
                    className={`w-full py-4 rounded-2xl font-black text-white shadow-2xl transition-all active:scale-[0.98] ${audience === 'PREMIUM' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
                  >
                    {audience === 'PREMIUM' ? 'Nâng cấp Premium' : 'Đăng ký Hội viên'}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}



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
