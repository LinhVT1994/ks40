'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bookmark, Sparkles, Target, Lock as LockIcon, Quote, CheckCircle2, BookMarked, PenLine, X, GripHorizontal, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleLikeAction } from '@/features/articles/actions/like';
import { toggleBookmarkAction } from '@/features/articles/actions/bookmark';
import { upsertReadHistoryAction, markArticleOpenedAction } from '@/features/articles/actions/read-history';
import { incrementViewAction } from '@/features/articles/actions/article';
import MarkdownViewer from '@/components/shared/MarkdownViewer';
import { useInteractionOptional } from '@/features/articles/context/ArticleInteractionContext';
import ShareMenu from '@/components/shared/ShareMenu';
import ArticleAnnotationLayer from '@/features/articles/components/ArticleAnnotationLayer';
import ArticleNotesPanel from '@/features/articles/components/ArticleNotesPanel';
import { type ArticleAnnotation, createAnnotationAction, updateAnnotationAction } from '@/features/articles/actions/annotation';
import { Check } from 'lucide-react';

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
}

export default function ArticleContent({
  articleId, content, overview, objectives,
  likeCount, commentCount, isLiked, isBookmarked,
  isGated = false, isPreview = false, audience,
  articleTitle = '',
  initialAnnotations = [],
}: ArticleContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [annotations, setAnnotations] = useState<ArticleAnnotation[]>(initialAnnotations);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [scratchpadText, setScratchpadText] = useState('');
  const [scratchpadSize, setScratchpadSize] = useState({ width: 440, height: 480 });
  const [activeScratchpadId, setActiveScratchpadId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const lastSavedText = useRef('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Background Auto-Save Engine
  useEffect(() => {
    if (!scratchpadOpen) return;
    const currentText = scratchpadText.trim();
    
    if (currentText === lastSavedText.current) {
      return;
    }
    
    // Reset status to idle while typing
    if (saveStatus !== 'idle') setSaveStatus('idle');
    clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(async () => {
      if (!currentText) return;
      setSaveStatus('saving');
      try {
        if (activeScratchpadId) {
          const updated = await updateAnnotationAction(activeScratchpadId, { note: currentText });
          setAnnotations(prev => prev.map(a => a.id === activeScratchpadId ? updated : a));
          lastSavedText.current = currentText;
          setSaveStatus('saved');
        } else {
          const saved = await createAnnotationAction({
            articleId,
            selectedText: '',
            paragraphIndex: -1,
            startOffset: -1,
            endOffset: -1,
            color: 'blue',
            note: currentText,
          });
          setActiveScratchpadId(saved.id);
          setAnnotations(prev => [saved, ...prev]);
          lastSavedText.current = currentText;
          setSaveStatus('saved');
        }
      } catch {
        setSaveStatus('idle');
      }
    }, 2500);

    return () => clearTimeout(typingTimeoutRef.current);
  }, [scratchpadText, scratchpadOpen, activeScratchpadId, articleId]);

  // Multilateral Resizing Logic
  const isResizing = useRef<string | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const startResize = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = direction;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = direction.includes('left') || direction.includes('right') ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const direction = isResizing.current;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setScratchpadSize(prev => {
      let newW = prev.width;
      let newH = prev.height;

      if (direction === 'right') newW += dx;
      if (direction === 'left')  newW -= dx;
      if (direction === 'bottom') newH += dy;
      if (direction === 'top')    newH -= dy;

      return {
        width: Math.max(320, Math.min(newW, window.innerWidth - 40)),
        height: Math.max(200, Math.min(newH, window.innerHeight - 40))
      };
    });
  }, []);

  const stopResize = useCallback(() => {
    isResizing.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [handleMouseMove, stopResize]);

  const handleAddGeneralNote = async (note: string) => {
    try {
      const saved = await createAnnotationAction({
        articleId,
        selectedText: '',
        paragraphIndex: -1,
        startOffset: -1,
        endOffset: -1,
        color: 'blue', // Or default
        note,
      });
      setAnnotations(prev => [saved, ...prev]);
      setActiveScratchpadId(saved.id);
      lastSavedText.current = note;
      import('sonner').then(({ toast }) => toast.success('Đã lưu ghi chú toàn bài'));
    } catch {
      import('sonner').then(({ toast }) => toast.error('Lưu ghi chú thất bại'));
    }
  };

  const handleDeleteScratchpad = async () => {
    if (!activeScratchpadId) return;
    if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này không?')) return;
    
    try {
      const idToDelete = activeScratchpadId;
      // Reset local state first for instant feedback
      setActiveScratchpadId(null);
      setScratchpadText('');
      lastSavedText.current = '';
      setAnnotations(prev => prev.filter(a => a.id !== idToDelete));
      
      await deleteAnnotationAction(idToDelete);
      import('sonner').then(({ toast }) => toast.success('Đã xóa ghi chú'));
    } catch {
      import('sonner').then(({ toast }) => toast.error('Xóa ghi chú thất bại'));
    }
  };

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
        onAnnotationsChange={setAnnotations}
      >
        <div data-article-content>
          {overview && (
            <div className="w-full max-w-[720px] mx-auto px-4 md:px-0">
          <div className="relative overflow-hidden px-0 py-2 mb-8 group">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="font-bold text-2xl md:text-3xl text-zinc-900 dark:text-zinc-100">Tóm tắt nhanh</h2>
                </div>
                  
                <div className="text-zinc-800 dark:text-zinc-200 text-lg md:text-xl font-medium tracking-tight opacity-95">
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
                <h2 className="font-bold text-2xl md:text-3xl text-zinc-900 dark:text-zinc-100">Mục tiêu bài đọc</h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg md:text-xl font-medium">Sau khi đọc xong bài này, bạn sẽ:</p>
              </div>

                <div className="max-w-none 
                  [&_ul]:list-none [&_ul]:p-0 [&_ul]:m-0 [&_ul]:space-y-4
                  [&_li]:relative [&_li]:pl-6
                  [&_li]:text-zinc-700 dark:[&_li]:text-zinc-300
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
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                  {!session ? 'Đăng nhập để đọc tiếp' : audience === 'PREMIUM' ? 'Mở khóa Premium' : 'Gia nhập Hội viên'}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium text-base sm:text-lg">
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
                      className="w-full h-14 flex items-center justify-center bg-transparent text-zinc-500 dark:text-zinc-400 font-bold rounded-2xl border border-zinc-300 dark:border-white/10 hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-all active:scale-95 text-sm"
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



      {/* Notes & Scratchpad toggle buttons (only logged-in, non-gated) */}
      {session && !isGated && (
        <>
          <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3">
            <button
              onClick={() => setScratchpadOpen(prev => !prev)}
              className="flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-full shadow-xl hover:bg-zinc-50 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95 group"
              title="Mở sổ tay nổi"
            >
              <PenLine className="w-5 h-5 group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => setNotesPanelOpen(true)}
              className="flex items-center justify-center w-12 h-12 bg-zinc-800/90 dark:bg-white/10 backdrop-blur-xl border border-white/10 text-white rounded-full shadow-2xl hover:bg-zinc-700/90 transition-all hover:scale-105 active:scale-95"
              title="Xem ghi chú & highlight"
            >
              <div className="relative flex items-center justify-center">
                <BookMarked className="w-5 h-5 text-primary" />
                {annotations.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-sm">
                    {annotations.length}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Draggable Scratchpad Widget */}
          <AnimatePresence>
            {scratchpadOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                drag={!isResizing.current}
                dragMomentum={false}
                style={{ width: scratchpadSize.width, height: scratchpadSize.height }}
                className="fixed bottom-40 right-24 z-[130] bg-white dark:bg-slate-800 rounded-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.5)] border border-zinc-200/50 dark:border-white/10 overflow-hidden flex flex-col"
              >
                {/* Edge Resize Handles */}
                <div className="absolute top-0 left-0 right-0 h-1 cursor-row-resize z-50 hover:bg-primary/20 transition-colors" onMouseDown={e => startResize(e, 'top')} />
                <div className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize z-50 hover:bg-primary/20 transition-colors" onMouseDown={e => startResize(e, 'bottom')} />
                <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 hover:bg-primary/20 transition-colors" onMouseDown={e => startResize(e, 'left')} />
                <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 hover:bg-primary/20 transition-colors" onMouseDown={e => startResize(e, 'right')} />

                {/* Drag Handle Top Bar */}
                <div className="h-10 bg-zinc-50 dark:bg-slate-900 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing shrink-0">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <GripHorizontal className="w-4 h-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Sổ tay nháp</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {activeScratchpadId && (
                      <button 
                        onClick={handleDeleteScratchpad}
                        className="p-1.5 hover:bg-red-500/10 rounded-md text-zinc-400 hover:text-red-500 transition-colors"
                        title="Xóa ghi chú"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={() => setScratchpadOpen(false)}
                      className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      title="Đóng sổ"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Editor Body */}
                <div className="p-4 flex flex-col relative flex-1 min-h-0 w-full overflow-hidden">
                  <textarea
                    autoFocus
                    value={scratchpadText}
                    onChange={e => setScratchpadText(e.target.value)}
                    placeholder="Ghi chú nhanh ý tưởng (hỗ trợ Markdown)..."
                    className="w-full h-full bg-transparent text-[16px] text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none resize-none leading-relaxed custom-scrollbar pb-6"
                  />
                  
                  <div className="absolute bottom-3 left-4 flex items-center h-5 pointer-events-none">
                    {saveStatus === 'saving' && (
                       <span className="text-[10px] font-medium text-zinc-400 italic flex items-center gap-1 animate-pulse">
                         <div className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                         <div className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                         <div className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                         Đang lưu...
                       </span>
                    )}
                    {saveStatus === 'saved' && (
                       <span className="text-[10px] font-bold text-emerald-500/80 flex items-center gap-1">
                         <Check className="w-2.5 h-2.5" /> Đã lưu đồng bộ
                       </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ArticleNotesPanel
            isOpen={notesPanelOpen}
            onClose={() => setNotesPanelOpen(false)}
            articleTitle={articleTitle}
            annotations={annotations}
            onAddGeneralNote={handleAddGeneralNote}
            onAnnotationDeleted={id => setAnnotations(prev => prev.filter(a => a.id !== id))}
            onScrollToAnnotation={id => {
              setNotesPanelOpen(false);
              setTimeout(() => {
                const el = document.querySelector(`[data-annotation-id="${id}"]`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }}
          />
        </>
      )}

      {/* Bookmark toast */}
      {bookmarkToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-zinc-800 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Bookmark className="w-4 h-4 fill-current" />
          {bookmarkToast}
        </div>
          )}
        </div>
      </ArticleAnnotationLayer>
    </div>
  );
}
