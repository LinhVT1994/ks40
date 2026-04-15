'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Heart, MessageCircle, Bookmark, Share2, Sparkles, Target, Lock as LockIcon } from 'lucide-react';
import { toggleLikeAction } from '@/features/articles/actions/like';
import { toggleBookmarkAction } from '@/features/articles/actions/bookmark';
import { upsertReadHistoryAction, markArticleOpenedAction } from '@/features/articles/actions/read-history';
import { incrementViewAction } from '@/features/articles/actions/article';
import ReactMarkdown from 'react-markdown';

const MarkdownViewer = dynamic(() => import('@/components/shared/MarkdownViewer'), { ssr: false });

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

  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [likes, setLikes] = useState(likeCount);
  const [likePending, startLike] = useTransition();
  const [bookmarkPending, startBookmark] = useTransition();
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);
  const [readProgress, setReadProgress] = useState(0);

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
      setReadProgress(prev => Math.max(prev, progress));
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
      setReadProgress(prev => Math.max(prev, p));
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

  const requireAuth = () => {
    router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  };

  const handleLike = () => {
    if (!session) { requireAuth(); return; }
    startLike(async () => {
      const result = await toggleLikeAction(articleId);
      setLiked(result.liked);
      setLikes(result.count);
    });
  };

  const handleBookmark = () => {
    if (!session) { requireAuth(); return; }
    const next = !bookmarked;
    setBookmarked(next);
    startBookmark(async () => {
      const result = await toggleBookmarkAction(articleId);
      setBookmarked(result.bookmarked);
      const msg = result.bookmarked ? 'Đã lưu bài viết' : 'Đã bỏ lưu';
      setBookmarkToast(msg);
      setTimeout(() => setBookmarkToast(null), 2000);
    });
  };

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
        <div className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 p-8 rounded-3xl mb-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors pointer-events-none">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-primary">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-display font-bold text-sm uppercase tracking-widest">Tóm tắt</h3>
            </div>
            <p className="text-zinc-600 dark:text-slate-400 leading-relaxed text-base italic max-w-4xl">
              "{overview}"
            </p>
          </div>
        </div>
      )}

      {objectives && (
        <div className="bg-emerald-50 dark:bg-emerald-500/[0.05] border border-emerald-200 dark:border-emerald-500/20 p-8 rounded-3xl mb-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors pointer-events-none">
            <Target className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400">
              <Target className="w-5 h-5" />
              <h3 className="font-display font-bold text-sm uppercase tracking-widest">Sau bài này bạn sẽ</h3>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none
              prose-ul:space-y-1.5 prose-li:text-zinc-700 dark:prose-li:text-slate-300
              prose-li:marker:text-emerald-500">
              <MarkdownViewer content={objectives} />
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
          <div className="absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-t from-zinc-50 dark:from-slate-950 via-zinc-50/98 dark:via-slate-950/98 via-30% to-transparent flex flex-col items-center justify-end pb-12 px-6 text-center">
            <div className="max-w-sm w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Icon */}
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center shadow-lg ${audience === 'PREMIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                {audience === 'PREMIUM' ? <Sparkles className="w-6 h-6" /> : <LockIcon className="w-6 h-6" />}
              </div>

              {/* Text */}
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-800 dark:text-white">
                  {!session ? 'Đăng nhập để đọc tiếp' : audience === 'PREMIUM' ? 'Nội dung Premium' : 'Dành cho thành viên'}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-slate-400 leading-normal">
                  {!session 
                    ? 'Tạo tài khoản miễn phí để đọc toàn bộ bài viết này và hàng trăm bài học khác.'
                    : audience === 'PREMIUM' 
                      ? 'Nâng cấp lên Premium để mở khóa toàn bộ bài viết, video và tài liệu độc quyền.'
                      : 'Tham gia chương trình Thành viên để truy cập nội dung này.'
                  }
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {!session ? (
                  <>
                    <a
                      href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                      className="w-full sm:w-auto px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                      Đăng nhập
                    </a>
                    <a
                      href="/register"
                      className="w-full sm:w-auto px-8 py-2.5 bg-white dark:bg-white/5 text-zinc-700 dark:text-slate-300 text-sm font-bold rounded-xl border border-zinc-300 dark:border-white/10 hover:border-primary/40 hover:text-primary transition-all active:scale-95"
                    >
                      Đăng ký miễn phí
                    </a>
                  </>
                ) : (
                  <a
                    href={audience === 'PREMIUM' ? '/pricing' : '#'}
                    className={`w-full sm:w-auto px-10 py-3 rounded-xl font-bold text-sm text-white shadow-xl transition-all active:scale-95 ${audience === 'PREMIUM' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
                  >
                    {audience === 'PREMIUM' ? 'Nâng cấp Premium ngay' : 'Tham gia Membership'}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Bar */}
      <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            disabled={likePending}
            className={`flex items-center gap-2 transition-all group ${liked ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'}`}
          >
            <div className="p-2 rounded-full group-hover:bg-rose-50 dark:group-hover:bg-rose-500/10 transition-colors">
              <Heart className={`w-6 h-6 group-hover:scale-110 transition-transform ${liked ? 'fill-current' : ''}`} />
            </div>
            <span className="font-bold text-sm">{likes}</span>
          </button>

          <span className="flex items-center gap-2 text-zinc-500">
            <div className="p-2 rounded-full">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm">{commentCount}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBookmark}
            disabled={bookmarkPending}
            className={`p-2 rounded-full transition-all ${bookmarked ? 'text-primary bg-primary/10' : 'text-zinc-500 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5'}`}
            title={bookmarked ? 'Bỏ lưu' : 'Lưu bài viết'}
          >
            <Bookmark className={`w-5 h-5 transition-all ${bookmarked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => navigator.share?.({ title: document.title, url: window.location.href })}
            className="p-2 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

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
