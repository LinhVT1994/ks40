'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileEdit, Trash2, Search, BookOpen, ChevronLeft, ChevronDown, Pencil, StickyNote, Highlighter, SearchX, ExternalLink, Plus } from 'lucide-react';
import type { ArticleAnnotation } from '@/features/articles/actions/annotation';
import { deleteAnnotationAction, getAllUserAnnotationsAction, updateAnnotationAction } from '@/features/articles/actions/annotation';
import MarkdownViewer from '@/components/shared/MarkdownViewer';
import { useNotes } from '@/context/NotesContext';
import { useRouter } from 'next/navigation';

type FilterType = 'Tất cả' | 'Ghi chú' | 'Highlight';

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 180;

// Normalize text: strip diacritics, lowercase, đ→d. Vietnamese-friendly.
function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd');
}

// Normalize while preserving a position map back to original string.
// map[i] = original index corresponding to normalized[i]
function normalizeWithMap(s: string): { norm: string; map: number[] } {
  let norm = '';
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const n = normalizeText(s[i]);
    for (let j = 0; j < n.length; j++) {
      norm += n[j];
      map.push(i);
    }
  }
  return { norm, map };
}

// Strip Markdown syntax for clean previews
function stripMarkdown(md: string | null | undefined): string {
  if (!md) return '';
  return md
    .replace(/^#+\s+/gm, '') // Headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/_(.*?)_/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/!\[.*?\]\(.*?\)/g, '') // Images
    .replace(/^>\s+/gm, '') // Blockquotes
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Code
    .replace(/^\s*[-*+]\s+/gm, '') // Lists
    .replace(/^\s*\d+\.\s+/gm, '') // Ordered lists
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/\n+/g, ' ') // Newlines to spaces
    .trim();
}

// Split query into tokens; each token must match (AND semantics).
function tokenize(q: string): string[] {
  const n = normalizeText(q).trim();
  if (!n) return [];
  return n.split(/\s+/).filter(Boolean);
}

// Render text with <mark> around token matches. Diacritic-insensitive.
function HighlightText({
  text,
  tokens,
  className,
}: {
  text: string | null | undefined;
  tokens: string[];
  className?: string;
}) {
  if (!text) return null;
  if (tokens.length === 0) return <span className={className}>{text}</span>;

  const { norm, map } = normalizeWithMap(text);
  const ranges: Array<[number, number]> = [];
  for (const tok of tokens) {
    if (!tok) continue;
    let from = 0;
    let at: number;
    while ((at = norm.indexOf(tok, from)) !== -1) {
      const origStart = map[at];
      const origEnd = (map[at + tok.length - 1] ?? origStart) + 1;
      ranges.push([origStart, origEnd]);
      from = at + tok.length;
    }
  }
  if (ranges.length === 0) return <span className={className}>{text}</span>;

  // Merge overlapping ranges
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [s, e] of ranges) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach(([s, e], i) => {
    if (cursor < s) parts.push(text.slice(cursor, s));
    parts.push(
      <mark key={i} className="bg-primary/20 text-inherit px-0.5 rounded font-bold">
        {text.slice(s, e)}
      </mark>,
    );
    cursor = e;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <span className={className}>{parts}</span>;
}

export default function GlobalNotesSidebar() {
  const router = useRouter();
  const { isSidebarOpen, closeSidebar, currentArticleId, currentArticleTitle, openScratchpad, setScrollToNoteId } = useNotes();
  const [annotations, setAnnotations] = useState<ArticleAnnotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('Tất cả');
  const [panelWidth, setPanelWidth] = useState<number>(420);
  const [selectedNote, setSelectedNote] = useState<ArticleAnnotation | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const isDragging = useRef(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isSidebarOpen) {
      loadNotes();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await getAllUserAnnotationsAction();
      setAnnotations(data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= Math.min(800, window.innerWidth - 100)) {
        setPanelWidth(newWidth);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize]);

  // Keyboard: "/" focuses search, Esc clears it
  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'Escape' && target === searchInputRef.current && searchQuery) {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSidebarOpen, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa ghi chú này?')) return;
    try {
      await deleteAnnotationAction(id);
      setAnnotations(prev => prev.filter(ann => ann.id !== id));
      if (selectedNote?.id === id) setSelectedNote(null);
    } catch {
      // toast error
    }
  };

  const handleCardClick = (ann: ArticleAnnotation) => {
    if (ann.articleId === currentArticleId) {
      setScrollToNoteId(ann.id);
    }
    setSelectedNote(ann);
  };

  const handleNavigateToSource = (ann: ArticleAnnotation) => {
    if (ann.articleId === currentArticleId) {
      setScrollToNoteId(ann.id);
    } else if (ann.article?.slug) {
      closeSidebar();
      router.push(`/article/${ann.article.slug}?noteId=${ann.id}`);
    }
  };

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const searchTokens = useMemo(() => tokenize(debouncedQuery), [debouncedQuery]);

  const searchIndex = useMemo(() => {
    const idx = new Map<string, string>();
    for (const ann of annotations) {
      const parts = [ann.selectedText ?? '', ann.note ?? '', ann.article?.title ?? ''];
      idx.set(ann.id, normalizeText(parts.join(' ')));
    }
    return idx;
  }, [annotations]);

  const searchedAnnotations = useMemo(() => {
    if (searchTokens.length === 0) return annotations;
    return annotations.filter(ann => {
      const hay = searchIndex.get(ann.id) ?? '';
      return searchTokens.every(tok => hay.includes(tok));
    });
  }, [annotations, searchTokens, searchIndex]);

  const counts = useMemo(() => ({
    'Tất cả': searchedAnnotations.length,
    'Ghi chú': searchedAnnotations.filter(a => !!a.note).length,
    'Highlight': searchedAnnotations.filter(a => !a.note).length,
  }), [searchedAnnotations]);

  const filtered = useMemo(() => {
    return searchedAnnotations.filter(ann => {
      if (filterType === 'Ghi chú' && !ann.note) return false;
      if (filterType === 'Highlight' && ann.note) return false;
      return true;
    });
  }, [searchedAnnotations, filterType]);

  const paginated = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const remaining = filtered.length - paginated.length;
  const hasMore = remaining > 0;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedQuery, filterType, isSidebarOpen]);

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[200]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ width: panelWidth }}
            className="fixed top-0 right-0 h-full bg-white/95 dark:bg-slate-900 border-l border-zinc-200/50 dark:border-white/10 z-[210] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Resize handle */}
            <div
              onMouseDown={startResizing}
              onDoubleClick={() => setPanelWidth(420)}
              title="Kéo để thay đổi kích thước · Double-click để reset"
              className="group/resize absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-[220] flex items-center justify-center hover:bg-primary/10 transition-colors"
            >
              <div className="w-[2px] h-12 rounded-full bg-zinc-300/0 group-hover/resize:bg-primary/60 dark:group-hover/resize:bg-primary/70 transition-colors" />
            </div>

            <AnimatePresence mode="wait">
              {!selectedNote ? (
                <motion.div 
                  key="list"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="px-5 py-3.5 border-b border-zinc-200/40 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-slate-900/50">
                    <div className="min-w-0">
                      <h2 className="text-lg font-black text-zinc-800 dark:text-white leading-tight">Ghi chú & Highlight</h2>
                    </div>
                    <button
                      onClick={closeSidebar}
                      className="shrink-0 p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-200 transition-all duration-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Search & Actions Area */}
                  <div className="border-b border-zinc-200/30 dark:border-white/5 bg-white/40 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 shrink-0 px-5 pt-3.5 pb-2.5 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="relative group flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Tìm ghi chú, trích dẫn, hoặc bài viết..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full bg-white/60 dark:bg-black/20 border border-zinc-200/50 dark:border-transparent focus:border-primary/40 dark:focus:border-primary/50 text-[13px] text-zinc-800 dark:text-slate-200 rounded-xl pl-10 pr-10 py-2.5 outline-none transition-all placeholder:text-zinc-400 shadow-sm shadow-zinc-200/20"
                        />
                        {searchQuery ? (
                          <button onClick={() => setSearchQuery('')} title="Xoá (Esc)" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-200 bg-white dark:bg-white/10 rounded-md shadow-sm">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-400 dark:text-zinc-500 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded px-1.5 py-0.5 pointer-events-none select-none">
                            /
                          </kbd>
                        )}
                      </div>
                    </div>

                    {/* Tabs Area */}
                    <div className="flex items-center gap-5 w-full overflow-x-auto no-scrollbar pt-2 px-1 -mx-1">
                      {(['Tất cả', 'Ghi chú', 'Highlight'] as FilterType[]).map(type => {
                        const isActive = filterType === type;
                        const count = counts[type];
                        return (
                          <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`relative pb-2.5 text-[10px] font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                              isActive ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300'
                            }`}
                          >
                            <span>{type}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none min-w-[16px] text-center transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'bg-zinc-100 dark:bg-white/5 text-zinc-400'}`}>
                              {count}
                            </span>
                            {isActive && (
                              <motion.div
                                layoutId="globalAnnotationTabFilter"
                                className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-full z-10"
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* List Content */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3 bg-zinc-50/30 dark:bg-transparent">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : filtered.length === 0 ? (
                      debouncedQuery ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-60 gap-3">
                          <SearchX className="w-10 h-10" />
                          <p className="text-sm font-bold">Không tìm thấy</p>
                          <p className="text-[11px] text-zinc-500 normal-case tracking-normal leading-relaxed max-w-[220px]">
                            Không có mục nào khớp với <span className="font-bold text-primary">"{debouncedQuery}"</span>
                          </p>
                          <button onClick={() => setSearchQuery('')} className="mt-2 text-[10px] font-bold text-primary hover:underline">Xóa bộ lọc tìm kiếm</button>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-40 gap-2">
                          <BookOpen className="w-10 h-10" />
                          <p className="text-[11px] text-zinc-500 max-w-[220px]">Hãy bắt đầu highlight hoặc ghi chú để tạo nên dấu ấn cá nhân của bạn.</p>
                        </div>
                      )
                    ) : (
                      <>
                        {debouncedQuery && (
                          <div className="flex items-center justify-between px-1 pb-1">
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{filtered.length} kết quả</span>
                            <button onClick={() => setSearchQuery('')} className="text-[10px] font-bold text-primary hover:underline">Xóa lọc</button>
                          </div>
                        )}

                        {paginated.map(ann => (
                          <NoteCard key={ann.id} annotation={ann} highlightTokens={searchTokens} onClick={() => handleCardClick(ann)} onEdit={() => { closeSidebar(); openScratchpad(ann.id); }} onDelete={() => handleDelete(ann.id)} isCurrentArticle={ann.articleId === currentArticleId} />
                        ))}

                        {hasMore && (
                          <button onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)} className="group/more w-full mt-2 py-3 rounded-2xl border border-dashed border-zinc-200 dark:border-white/10 hover:border-primary/40 dark:hover:border-primary/40 hover:bg-primary/[0.03] transition-all flex items-center justify-center gap-2 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-primary">
                            <ChevronDown className="w-3.5 h-3.5 group-hover/more:translate-y-0.5 transition-transform" />
                            <span>Xem thêm</span>
                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 group-hover/more:bg-primary/10 text-[9px] tracking-wider">{remaining}</span>
                          </button>
                        )}

                        {!hasMore && filtered.length > PAGE_SIZE && (
                          <div className="flex items-center justify-center py-4 gap-3 opacity-50">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-200 dark:to-white/10 max-w-[80px]" />
                            <span className="text-[9px] font-bold text-zinc-400">Hết · {filtered.length} mục</span>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-200 dark:to-white/10 max-w-[80px]" />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <footer className="shrink-0 p-4 border-t border-zinc-200/40 dark:border-white/5 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl">
                    <button 
                      onClick={() => { closeSidebar(); openScratchpad(); }}
                      className="group/new w-full py-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-white/10 hover:border-primary/40 dark:hover:border-primary/40 hover:bg-primary/[0.03] transition-all flex items-center justify-center gap-2.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-primary"
                    >
                      <Plus className="w-3.5 h-3.5 transition-transform group-hover/new:rotate-90" />
                      <span>Viết ghi chú mới</span>
                    </button>
                  </footer>
                </motion.div>
              ) : (
                <NoteDetail 
                  note={selectedNote} 
                  onBack={() => setSelectedNote(null)} 
                  onDelete={handleDelete}
                  onNavigate={handleNavigateToSource}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

type ColorTokens = {
  bg: string;
  border: string;
  stripe: string;
  shadow: string;
  title: string;
  accent: string;
  glow: string;
};

const COLOR_TOKENS: Record<string, ColorTokens> = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50/90 to-blue-100/40 dark:from-blue-500/[0.035] dark:to-sky-500/[0.015]',
    border: 'border-blue-200/60 dark:border-blue-500/10 hover:border-blue-300/50 dark:hover:border-blue-400/20',
    stripe: 'bg-gradient-to-b from-blue-400 to-sky-400 dark:from-blue-400/70 dark:to-sky-400/70',
    shadow: 'hover:shadow-blue-200/30 dark:hover:shadow-blue-500/5',
    title: 'text-blue-900/80 dark:text-zinc-300',
    accent: 'text-blue-600 dark:text-blue-300/80',
    glow: 'bg-blue-400',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 dark:from-emerald-500/[0.035] dark:to-teal-500/[0.015]',
    border: 'border-emerald-200/60 dark:border-emerald-500/10 hover:border-emerald-300/50 dark:hover:border-emerald-400/20',
    stripe: 'bg-gradient-to-b from-emerald-400 to-teal-400 dark:from-emerald-400/70 dark:to-teal-400/70',
    shadow: 'hover:shadow-emerald-200/30 dark:hover:shadow-emerald-500/5',
    title: 'text-emerald-900/80 dark:text-zinc-300',
    accent: 'text-emerald-600 dark:text-emerald-300/80',
    glow: 'bg-emerald-400',
  },
  pink: {
    bg: 'bg-gradient-to-br from-rose-50/90 to-rose-100/40 dark:from-rose-500/[0.035] dark:to-pink-500/[0.015]',
    border: 'border-rose-200/60 dark:border-rose-500/10 hover:border-rose-300/50 dark:hover:border-rose-400/20',
    stripe: 'bg-gradient-to-b from-rose-400 to-pink-400 dark:from-rose-400/70 dark:to-pink-400/70',
    shadow: 'hover:shadow-rose-200/30 dark:hover:shadow-rose-500/5',
    title: 'text-rose-900/80 dark:text-zinc-300',
    accent: 'text-rose-600 dark:text-rose-300/80',
    glow: 'bg-rose-400',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-50/95 to-amber-100/40 dark:from-amber-500/[0.035] dark:to-orange-500/[0.015]',
    border: 'border-amber-200/60 dark:border-amber-500/10 hover:border-amber-300/50 dark:hover:border-amber-400/20',
    stripe: 'bg-gradient-to-b from-amber-400 to-orange-400 dark:from-amber-400/70 dark:to-orange-400/70',
    shadow: 'hover:shadow-amber-200/30 dark:hover:shadow-amber-500/5',
    title: 'text-amber-900/80 dark:text-zinc-300',
    accent: 'text-amber-700 dark:text-amber-300/80',
    glow: 'bg-amber-400',
  },
};

const getColorTokens = (color: string): ColorTokens =>
  COLOR_TOKENS[color] ?? COLOR_TOKENS.yellow;

function NoteCard({
  annotation,
  highlightTokens,
  onClick,
  onEdit,
  onDelete,
  isCurrentArticle,
}: {
  annotation: ArticleAnnotation;
  highlightTokens: string[];
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isCurrentArticle: boolean;
}) {
  const hasNote = !!annotation.note;
  const hasHighlight = !!annotation.selectedText;
  const tokens = getColorTokens(annotation.color);

  const typeLabel = hasNote && hasHighlight
    ? 'Ghi chú + Trích'
    : hasNote
      ? 'Ghi chú'
      : 'Highlight';

  const TypeIcon = hasNote ? StickyNote : Highlighter;

  const shortDate = new Date(annotation.createdAt).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-[1px] hover:shadow-md ${tokens.bg} ${tokens.shadow} ${
        isCurrentArticle
          ? 'border border-primary/30 shadow-sm shadow-primary/5 ring-1 ring-primary/5'
          : `border ${tokens.border}`
      }`}
    >

      {/* Soft glow aura on hover */}
      <div className={`absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${tokens.glow}`} />

      <div className="relative px-5 py-4 space-y-2.5">
        {/* Header row: article title + hover actions */}
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[12px] font-black uppercase tracking-[0.14em] line-clamp-1 flex-1 leading-snug ${tokens.title}`}>
            <HighlightText
              text={annotation.article?.title || 'Ghi chú khuyết danh'}
              tokens={highlightTokens}
            />
          </p>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1 shrink-0">
            {hasNote && (
              <>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  title="Sửa ghi chú"
                  className="p-1.5 rounded-md hover:bg-primary/10 text-zinc-400 hover:text-primary transition-colors active:scale-90"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  title="Xóa"
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors active:scale-90"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Body: quote + note preview */}
        {hasHighlight && (
          <p className="text-[14.5px] font-serif italic text-zinc-800 dark:text-zinc-100 leading-relaxed line-clamp-3">
            <span className={`mr-0.5 ${tokens.accent} opacity-60`}>"</span>
            <HighlightText text={annotation.selectedText} tokens={highlightTokens} />
            <span className={`ml-0.5 ${tokens.accent} opacity-60`}>"</span>
          </p>
        )}

        {hasNote && (
          <div className={`flex items-start gap-2 text-[13.5px] leading-relaxed ${
            hasHighlight
              ? `text-zinc-600 dark:text-zinc-400 pt-2 border-t border-dashed border-current/10`
              : 'text-zinc-800 dark:text-zinc-100'
          }`}>
            <StickyNote className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${tokens.accent}`} />
            <HighlightText
              text={stripMarkdown(annotation.note)}
              tokens={highlightTokens}
              className={hasHighlight ? 'line-clamp-2' : 'line-clamp-3'}
            />
          </div>
        )}

        {/* Footer meta: type · date · (đang đọc) */}
        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] pt-1 ${tokens.accent} opacity-70`}>
          <span>{typeLabel}</span>
          <span className="opacity-50">·</span>
          <span className="normal-case tracking-wider">{shortDate}</span>
          {isCurrentArticle && (
            <>
              <span className="opacity-50">·</span>
              <span className="text-primary opacity-100">Đang đọc</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function NoteDetail({ 
  note, 
  onBack, 
  onDelete,
  onNavigate
}: { 
  note: ArticleAnnotation; 
  onBack: () => void; 
  onDelete: (id: string) => void;
  onNavigate: (ann: ArticleAnnotation) => void;
}) {
  return (
    <motion.div 
      key="detail"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="flex flex-col h-full bg-white dark:bg-slate-900"
    >
      {/* Detail Header */}
      <div className="px-5 py-3.5 border-b border-zinc-200/60 dark:border-white/5 flex items-center gap-3 bg-white dark:bg-slate-900/50">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-200 transition-all active:scale-90"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-[15px] font-black text-zinc-800 dark:text-white uppercase tracking-wider leading-none">Chi tiết</h2>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1 block">
             Lưu {new Date(note.createdAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </div>

      {/* Detail Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* The Citation */}
        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1.5 bg-primary/20 rounded-full" />
          <p className="text-lg font-serif italic text-zinc-600 dark:text-zinc-300 leading-relaxed">
            "{note.selectedText || 'Ghi chú tự do không có nội dung trích dẫn.'}"
          </p>
        </div>

        {/* The Personal Note */}
        {note.note && (
          <div className="space-y-3">
            <div className="prose prose-sm prose-compact dark:prose-invert max-w-none">
              <MarkdownViewer content={note.note} />
            </div>
          </div>
        )}

         {/* Meta Info */}
         <div className="pt-6 space-y-4">
            <button
              onClick={() => onNavigate(note)}
              className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 space-y-3 text-left hover:border-primary/30 transition-colors group/source"
            >
               <div className="flex items-center gap-2">
                 <BookOpen className="w-4 h-4 text-zinc-400 group-hover/source:text-primary transition-colors" />
                 <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Nguồn bài viết</span>
               </div>
               <p className="text-sm font-bold text-zinc-800 dark:text-slate-200 group-hover/source:text-primary transition-colors">
                 {note.article?.title || `Bản tin Premium #${note.articleId.slice(-4)}`}
               </p>
            </button>
         </div>
      </div>

      {/* Detail Actions */}
      <div className="p-6 border-t border-zinc-200/60 dark:border-white/5 bg-zinc-50/50 dark:bg-slate-900/80 flex items-center justify-center">
        <button
          onClick={() => onDelete(note.id)}
          className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-bold text-sm transition-all active:scale-95 group"
        >
          <Trash2 className="w-4 h-4" />
          Xóa ghi chú này
        </button>
      </div>
    </motion.div>
  );
}
