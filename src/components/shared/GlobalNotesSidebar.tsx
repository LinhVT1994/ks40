'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileEdit, Trash2, Search, BookOpen, ChevronLeft, ChevronDown, Pencil, StickyNote, Highlighter, SearchX, ExternalLink, Plus, CheckSquare, Square, Check, Bold, Italic, List, ListOrdered, Heading as HeadingIcon, Quote as QuoteIcon, Link as LinkIcon, Minus, MousePointer2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ArticleAnnotation } from '@/features/articles/actions/annotation';
import { deleteAnnotationAction, deleteBulkAnnotationsAction, getAllUserAnnotationsAction, updateAnnotationAction } from '@/features/articles/actions/annotation';
import MarkdownViewer from '@/components/shared/MarkdownViewer';
import { useNotes } from '@/context/NotesContext';
import { useRouter } from 'next/navigation';
import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown-editor';

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
  const {
    isSidebarOpen,
    closeSidebar,
    currentArticleId,
    currentArticleTitle,
    openScratchpad,
    setScrollToNoteId,
    isSelectMode,
    selectedIds,
    enterSelectMode,
    exitSelectMode,
    toggleSelected,
    selectAll,
    clearSelection,
  } = useNotes();
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

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const selectedSet = new Set(ids);
    const selectedItems = annotations.filter(a => selectedSet.has(a.id));
    const noteCount = selectedItems.filter(a => !!a.note).length;
    const highlightCount = selectedItems.length - noteCount;

    const breakdown =
      noteCount && highlightCount
        ? `${noteCount} ghi chú và ${highlightCount} highlight`
        : noteCount
          ? `${noteCount} ghi chú`
          : `${highlightCount} highlight`;

    if (!confirm(`Bạn có chắc muốn xóa ${breakdown}? Hành động này không thể hoàn tác.`)) return;

    try {
      const { deletedIds } = await deleteBulkAnnotationsAction(ids);
      const deletedSet = new Set(deletedIds);
      setAnnotations(prev => prev.filter(ann => !deletedSet.has(ann.id)));
      if (selectedNote && deletedSet.has(selectedNote.id)) setSelectedNote(null);
      exitSelectMode();
    } catch {
      // toast error
    }
  };

  const handleCardClick = (ann: ArticleAnnotation) => {
    if (isSelectMode) {
      toggleSelected(ann.id);
      return;
    }
    
    // Nếu là ghi chú tự do (không có selectedText) thì mở xem chi tiết
    // Nếu là ghi chú inline (có selectedText) thì dẫn về bài viết gốc
    if (!ann.selectedText) {
      setSelectedNote(ann);
    } else {
      handleNavigateToSource(ann);
    }
  };

  const handleNavigateToSource = (ann: ArticleAnnotation) => {
    if (ann.articleId !== currentArticleId && ann.article?.slug) {
      closeSidebar();
      router.push(`/article/${ann.article.slug}?noteId=${ann.id}`);
    } else if (ann.articleId === currentArticleId) {
      setScrollToNoteId(ann.id);
      // Trên màn hình nhỏ, tự đóng sidebar để người dùng xem bài viết
      if (window.innerWidth < 1024) closeSidebar();
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
                      <h2 className="text-lg font-black text-zinc-800 dark:text-white leading-tight">
                        {isSelectMode
                          ? selectedIds.size > 0
                            ? `Đã chọn ${selectedIds.size}`
                            : 'Chọn mục'
                          : 'Ghi chú & Highlight'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1">
                      {filtered.length > 0 && (
                        <button
                          onClick={() => (isSelectMode ? exitSelectMode() : enterSelectMode())}
                          className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-300 ${
                            isSelectMode
                              ? 'bg-primary/10 text-primary hover:bg-primary/15'
                              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-slate-200 hover:bg-zinc-100 dark:hover:bg-white/10'
                          }`}
                        >
                          {isSelectMode ? 'Huỷ' : 'Chọn'}
                        </button>
                      )}
                      <button
                        onClick={closeSidebar}
                        className="shrink-0 p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-200 transition-all duration-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
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
                          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-400 dark:text-slate-500 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded px-1.5 py-0.5 pointer-events-none select-none">
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
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-slate-500">{filtered.length} kết quả</span>
                            <button onClick={() => setSearchQuery('')} className="text-[10px] font-bold text-primary hover:underline">Xóa lọc</button>
                          </div>
                        )}

                        {paginated.map(ann => (
                          <NoteCard
                            key={ann.id}
                            annotation={ann}
                            highlightTokens={searchTokens}
                            onClick={() => handleCardClick(ann)}
                            onEdit={() => { closeSidebar(); openScratchpad(ann.id); }}
                            onDelete={() => handleDelete(ann.id)}
                            isCurrentArticle={ann.articleId === currentArticleId}
                            isSelectMode={isSelectMode}
                            isSelected={selectedIds.has(ann.id)}
                            onNavigateToSource={(e) => {
                              e.stopPropagation();
                              handleNavigateToSource(ann);
                            }}
                          />
                        ))}

                        {hasMore && (
                          <button onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)} className="group/more w-full mt-2 py-3 rounded-2xl border border-dashed border-zinc-200 dark:border-white/10 hover:border-primary/40 dark:hover:border-primary/40 hover:bg-primary/[0.03] transition-all flex items-center justify-center gap-2 text-[11px] font-bold text-zinc-500 dark:text-slate-500 hover:text-primary">
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
                    {isSelectMode ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const allFilteredIds = filtered.map(a => a.id);
                            const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id));
                            if (allSelected) clearSelection();
                            else selectAll(allFilteredIds);
                          }}
                          className="shrink-0 px-3 py-2.5 rounded-xl text-[11px] font-bold text-zinc-600 dark:text-slate-300 hover:text-primary hover:bg-primary/5 border border-zinc-200 dark:border-white/10 hover:border-primary/30 transition-all"
                        >
                          {filtered.length > 0 && filtered.every(a => selectedIds.has(a.id))
                            ? 'Bỏ chọn'
                            : 'Chọn tất cả'}
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          disabled={selectedIds.size === 0}
                          className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold text-[11px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500/10 disabled:hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xoá{selectedIds.size > 0 ? ` ${selectedIds.size} mục` : ''}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { closeSidebar(); openScratchpad(); }}
                        className="group/new w-full py-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-white/10 hover:border-primary/40 dark:hover:border-primary/40 hover:bg-primary/[0.03] transition-all flex items-center justify-center gap-2.5 text-[11px] font-bold text-zinc-500 dark:text-slate-500 hover:text-primary"
                      >
                        <Plus className="w-3.5 h-3.5 transition-transform group-hover/new:rotate-90" />
                        <span>Viết ghi chú mới</span>
                      </button>
                    )}
                  </footer>
                </motion.div>
              ) : (
                <NoteDetail 
                  note={selectedNote} 
                  onBack={() => setSelectedNote(null)} 
                  onUpdate={(updatedNote) => {
                    setAnnotations(prev => prev.map(ann => ann.id === updatedNote.id ? { ...ann, ...updatedNote } : ann));
                  }}
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

// Background, border, and hover color now live in `.ks-note-card` (globals.css)
// driven by CSS vars, so the card tint mirrors the in-article highlight palette
// (yellow highlight ↔ yellow card). The tokens here cover only the bits that
// stay in Tailwind: text colors, the stripe, and the hover glow.
type ColorTokens = {
  stripe: string;
  title: string;
  accent: string;
  glow: string;
};

const COLOR_TOKENS: Record<string, ColorTokens> = {
  blue: {
    stripe: 'bg-blue-500 dark:bg-blue-400',
    title: 'text-zinc-900 dark:text-slate-100',
    accent: 'text-blue-600 dark:text-blue-400',
    glow: 'bg-blue-400 dark:bg-blue-500',
  },
  green: {
    stripe: 'bg-emerald-500 dark:bg-emerald-400',
    title: 'text-zinc-900 dark:text-slate-100',
    accent: 'text-emerald-600 dark:text-emerald-400',
    glow: 'bg-emerald-400 dark:bg-emerald-500',
  },
  pink: {
    stripe: 'bg-rose-500 dark:bg-rose-400',
    title: 'text-zinc-900 dark:text-slate-100',
    accent: 'text-rose-600 dark:text-rose-400',
    glow: 'bg-rose-400 dark:bg-rose-500',
  },
  yellow: {
    stripe: 'bg-amber-500 dark:bg-amber-400',
    title: 'text-zinc-900 dark:text-slate-100',
    accent: 'text-amber-600 dark:text-amber-400',
    glow: 'bg-amber-400 dark:bg-amber-500',
  },
};

const VALID_COLORS = new Set(Object.keys(COLOR_TOKENS));
const normalizeColor = (color: string): string =>
  VALID_COLORS.has(color) ? color : 'yellow';

const getColorTokens = (color: string): ColorTokens =>
  COLOR_TOKENS[normalizeColor(color)];

function NoteCard({
  annotation,
  highlightTokens,
  onClick,
  onEdit,
  onDelete,
  isCurrentArticle,
  isSelectMode,
  isSelected,
  onNavigateToSource,
}: {
  annotation: ArticleAnnotation;
  highlightTokens: string[];
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isCurrentArticle: boolean;
  isSelectMode: boolean;
  isSelected: boolean;
  onNavigateToSource: (e: React.MouseEvent) => void;
}) {
  const hasNote = !!annotation.note;
  const hasHighlight = !!annotation.selectedText;
  const tokens = getColorTokens(annotation.color);

  const typeLabel = hasNote && hasHighlight
    ? 'Ghi chú + Trích'
    : hasNote
      ? 'Ghi chú'
      : 'Highlight';

  const timeAgo = formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true, locale: vi });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onClick}
      data-color={normalizeColor(annotation.color)}
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-[1px] ${
        isSelectMode && isSelected
          ? 'border-2 border-primary ring-2 ring-primary/20 bg-primary/[0.04] dark:bg-primary/[0.08]'
          : isCurrentArticle
            ? 'ks-note-card border border-primary/40 ring-1 ring-primary/10'
            : 'ks-note-card border'
      } hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]`}
    >

      {/* Soft glow aura on hover */}
      <div className={`absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${tokens.glow}`} />

      {/* Selection checkbox */}
      {isSelectMode && (
        <div className="absolute top-3 right-3 z-10">
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-primary border-primary'
                : 'bg-white/70 dark:bg-slate-900/70 border-zinc-300 dark:border-white/20'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
        </div>
      )}

      <div className={`relative px-5 py-2.5 space-y-0.5 ${isSelectMode ? 'pr-12' : ''}`}>
        {/* Header row: article title + hover actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${tokens.stripe}`} title="Màu danh mục" />
            <p className="text-[14px] font-bold line-clamp-1 flex-1 leading-tight text-black dark:text-white">
              <HighlightText
                text={annotation.article?.title || 'Ghi chú khuyết danh'}
                tokens={highlightTokens}
              />
            </p>
          </div>

          <div className="shrink-0 flex items-center">
            {!isSelectMode && (
              <button
                onClick={onNavigateToSource}
                title="Di chuyển đến vị trí này trong bài viết"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Body: quote + note preview */}
        {hasHighlight && (
          <p className="text-[1rem] font-serif text-zinc-800 dark:text-slate-200 leading-relaxed line-clamp-3">
            <span className={`mr-0.5 ${tokens.accent} opacity-60`}>"</span>
            <HighlightText text={annotation.selectedText} tokens={highlightTokens} />
            <span className={`ml-0.5 ${tokens.accent} opacity-60`}>"</span>
          </p>
        )}

        {hasNote && (
          <div className={`text-[1rem] leading-relaxed ${
            hasHighlight
              ? `text-zinc-600 dark:text-slate-400 pt-1.5 border-t border-dashed border-current/10`
              : 'text-zinc-800 dark:text-slate-200'
          }`}>
            <HighlightText
              text={stripMarkdown(annotation.note)}
              tokens={highlightTokens}
              className={hasHighlight ? 'line-clamp-2' : 'line-clamp-3'}
            />
          </div>
        )}

        {/* Footer meta: type · date · (đang đọc) */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold pt-1 text-zinc-400 dark:text-zinc-500">
          <span>{typeLabel}</span>
          <span className="opacity-50">·</span>
          <span className="normal-case tracking-wider">{timeAgo}</span>
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
  note: initialNote, 
  onBack, 
  onUpdate,
  onDelete,
  onNavigate
}: { 
  note: ArticleAnnotation; 
  onBack: () => void; 
  onUpdate: (updated: Partial<ArticleAnnotation>) => void;
  onDelete: (id: string) => void;
  onNavigate: (ann: ArticleAnnotation) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [isPublic, setIsPublic] = useState(initialNote.isPublic || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let title = '';
    let body = initialNote.note || '';

    if (body.startsWith('# ')) {
      const lines = body.split('\n');
      title = lines[0].replace('# ', '');
      body = lines.slice(1).join('\n').trim();
    } else {
      title = 'Ghi chú';
    }

    setNoteTitle(title);
    setNoteContent(body);
  }, [initialNote.id, initialNote.note]);

  const handleSave = async () => {
    // If editing, sync HTML back to markdown first
    let finalNote = noteContent;
    if (isEditing && editorRef.current) {
      const bodyMd = htmlToMarkdown(editorRef.current.innerHTML);
      finalNote = `# ${noteTitle.trim() || 'Ghi chú'}\n\n${bodyMd}`;
    }

    if (finalNote === initialNote.note && isPublic === initialNote.isPublic) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateAnnotationAction(initialNote.id, {
        note: finalNote,
        isPublic: isPublic
      });
      
      onUpdate({
        id: initialNote.id,
        note: finalNote,
        isPublic: isPublic
      });

      setIsEditing(false);
      // No need to setNoteContent here as the useEffect will handle it
      import('sonner').then(({ toast }) => toast.success('Đã cập nhật ghi chú'));
    } catch (error) {
      console.error('Failed to save note:', error);
      import('sonner').then(({ toast }) => toast.error('Lưu ghi chú thất bại'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCommand = (command: string, value?: string) => {
    if (command === 'createLink') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.toString().length === 0) {
        import('sonner').then(({ toast }) => toast.error('Vui lòng chọn văn bản trước khi chèn link'));
        return;
      }
      setIsLinkMode(true);
      return;
    }
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const confirmLink = () => {
    if (linkUrl) {
      let url = linkUrl.trim();
      if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:') && !url.startsWith('#')) {
        url = 'https://' + url;
      }
      document.execCommand('createLink', false, url);
    }
    setIsLinkMode(false);
    setLinkUrl('');
    editorRef.current?.focus();
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      const target = selection.anchorNode?.parentElement;
      const block = target?.closest('h3, blockquote');
      if (block?.tagName === 'H3') {
        e.preventDefault(); document.execCommand('insertHTML', false, '<div><br></div>');
      }
    }
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      const range = selection.getRangeAt(0);
      const li = selection.anchorNode?.parentElement?.closest('li');
      if (li && range.startOffset === 0) {
        if (li.textContent === '' || li.innerHTML === '<br>') {
          e.preventDefault();
          document.execCommand('outdent', false);
        }
      }
    }
  };

  const tokens = getColorTokens(initialNote.color);

  return (
    <motion.div
      key="detail"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-white/60 dark:bg-slate-900/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-200 transition-all active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 ml-2">
            {!initialNote.selectedText && (
              <input
                type="text"
                value={noteTitle}
                onChange={e => setNoteTitle(e.target.value)}
                placeholder="Nhập tiêu đề..."
                className="bg-transparent border-none outline-none text-[15px] font-bold text-zinc-800 dark:text-slate-200 placeholder:text-zinc-400/70 w-full"
              />
            )}
          </div>
        </div>
      </div>


      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {/* Source Citation */}
        <div className="px-6 pt-6 pb-4">
          <div className="relative group/source cursor-pointer" onClick={() => onNavigate(initialNote)}>
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full group-hover/source:bg-primary/40 transition-colors" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Trích dẫn từ bài viết</p>
            <p className="text-[13px] font-serif italic text-zinc-600 dark:text-slate-400 leading-relaxed line-clamp-3 group-hover/source:text-zinc-800 dark:group-hover/source:text-slate-200 transition-colors">
              "{initialNote.selectedText || 'Ghi chú tự do'}"
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-primary opacity-70 group-hover/source:opacity-100 transition-opacity">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="line-clamp-1">{initialNote.article?.title}</span>
            </div>

            <div className="mt-5 flex items-center gap-2">
              {!isEditing && !initialNote.selectedText && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-primary dark:hover:text-primary-light transition-all active:scale-90"
                >
                  {initialNote.note ? (
                    <>
                      <Pencil className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Chỉnh sửa</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Thêm ghi chú</span>
                    </>
                  )}
                </button>
              )}
              {initialNote.authorId && (
                <div 
                  onClick={() => setIsPublic(!isPublic)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                    isPublic 
                      ? 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30' 
                      : 'bg-zinc-100 dark:bg-white/5 text-zinc-400'
                  }`}
                >
                  {isPublic ? <CheckSquare className="w-3 h-3" /> : <StickyNote className="w-3 h-3" />}
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    {isPublic ? 'Công khai' : 'Cá nhân'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-zinc-100 dark:bg-white/5 mx-6 my-2" />

        {/* Note Content Area */}
        {(noteContent || isEditing) && (
          <div className="flex-1 p-6 pt-4 flex flex-col min-h-[200px]">
            {!isEditing ? (
              <div className="flex-1 group/note">
                <div className="prose prose-compact prose-zinc dark:prose-invert max-w-none text-[1rem] leading-relaxed text-zinc-800 dark:text-slate-200 font-normal font-sans">
                  {noteContent && (
                    <MarkdownViewer content={noteContent} compact variant="note" />
                  )}
                </div>
              </div>
            ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center h-10 mb-2 shrink-0 overflow-hidden">
                <AnimatePresence mode="wait">
                  {isLinkMode ? (
                    <motion.div 
                      key="link-input"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      className="flex-1 flex items-center gap-2"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Dán hoặc nhập URL..."
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') confirmLink();
                          if (e.key === 'Escape') setIsLinkMode(false);
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-[12px] font-normal text-zinc-700 dark:text-slate-300 placeholder:text-zinc-400"
                      />
                      <div className="flex items-center gap-1">
                        <button onClick={() => setIsLinkMode(false)} className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">Hủy</button>
                        <button onClick={confirmLink} className="px-3 py-1 bg-primary text-white text-[11px] font-bold rounded-lg shadow-sm shadow-primary/20 transition-all active:scale-95">Áp dụng</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="toolbar-buttons"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-0.5 w-full overflow-x-auto no-scrollbar"
                    >
                      <button onClick={() => handleCommand('bold')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-500 transition-colors"><Bold className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleCommand('italic')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-500 transition-colors"><Italic className="w-3.5 h-3.5" /></button>
                      <div className="w-px h-3 bg-zinc-200 dark:bg-white/10 mx-1" />
                      <button onClick={() => handleCommand('formatBlock', '<h3>')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-500 transition-colors"><HeadingIcon className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleCommand('formatBlock', '<blockquote>')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-500 transition-colors"><QuoteIcon className="w-3.5 h-3.5" /></button>
                      <div className="w-px h-3 bg-zinc-200 dark:bg-white/10 mx-1" />
                      <button onClick={() => handleCommand('insertUnorderedList')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-500 transition-colors"><List className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleCommand('insertOrderedList')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-500 transition-colors"><ListOrdered className="w-3.5 h-3.5" /></button>
                      <div className="w-px h-3 bg-zinc-200 dark:bg-white/10 mx-1" />
                      <button onClick={() => handleCommand('createLink')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-500 transition-colors"><LinkIcon className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleCommand('insertHorizontalRule')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-500 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onKeyDown={handleEditorKeyDown}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(noteContent) }}
                className="flex-1 w-full outline-none leading-relaxed text-[1rem] text-zinc-800 dark:text-slate-200 prose prose-compact prose-zinc dark:prose-invert max-w-none font-normal font-sans"
              />
              
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-white/5">
                <div className="text-[10px] text-slate-400 font-medium italic">
                  {isPublic ? 'Mọi người đều sẽ thấy' : 'Chỉ bạn mới thấy'}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setNoteContent(initialNote.note || '');
                    }}
                    className="px-3 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-bold rounded-xl disabled:opacity-50 transition-all ${
                      isPublic 
                        ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20' 
                        : 'bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black shadow-lg shadow-black/10'
                    }`}
                  >
                    {isSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Lưu lại
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

      {!isEditing && (
        <div className="p-6 border-t border-zinc-200/60 dark:border-white/5 bg-zinc-50/50 dark:bg-slate-900/80 flex items-center justify-between gap-4">
          <button
            onClick={() => onDelete(initialNote.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold text-[11px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa
          </button>
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {new Date(initialNote.createdAt).toLocaleDateString('vi-VN')}
          </div>
        </div>
      )}
    </motion.div>
  );
}
