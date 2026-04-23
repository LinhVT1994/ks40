'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileEdit, Trash2, MapPin, Search, Sparkles, BookOpen } from 'lucide-react';
import type { ArticleAnnotation } from '@/features/articles/actions/annotation';
import { deleteAnnotationAction } from '@/features/articles/actions/annotation';
import MarkdownViewer from '@/components/shared/MarkdownViewer';

interface ArticleNotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  articleTitle: string;
  annotations: ArticleAnnotation[];
  onAddGeneralNote?: (note: string) => Promise<void>;
  onAnnotationDeleted: (id: string) => void;
  onScrollToAnnotation: (id: string) => void;
}

type FilterType = 'Tất cả' | 'Ghi chú' | 'Highlight';

const COLOR_MAP: Record<string, string> = {
  yellow: 'amber',
  green:  'emerald',
  blue:   'blue',
  pink:   'pink',
};

function getBorderClass(color: string) {
  switch (COLOR_MAP[color] ?? 'amber') {
    case 'blue':    return 'border-blue-500/50 text-blue-400';
    case 'emerald': return 'border-emerald-500/50 text-emerald-400';
    case 'pink':    return 'border-pink-500/50 text-pink-400';
    default:        return 'border-amber-500/50 text-amber-400';
  }
}

function getBadgeClass(color: string, hasNote: boolean) {
  const c = COLOR_MAP[color] ?? 'amber';
  if (hasNote) {
    switch (c) {
      case 'blue':    return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
      case 'emerald': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
      case 'pink':    return 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300';
      default:        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
    }
  } else {
    switch (c) {
      case 'blue':    return 'bg-blue-50/50 text-blue-500/80 dark:bg-blue-500/10 dark:text-blue-400/60 border border-blue-200/50 dark:border-blue-500/20';
      case 'emerald': return 'bg-emerald-50/50 text-emerald-500/80 dark:bg-emerald-500/10 dark:text-emerald-400/60 border border-emerald-200/50 dark:border-emerald-500/20';
      case 'pink':    return 'bg-pink-50/50 text-pink-500/80 dark:bg-pink-500/10 dark:text-pink-400/60 border border-pink-200/50 dark:border-pink-500/20';
      default:        return 'bg-amber-50/50 text-amber-500/80 dark:bg-amber-500/10 dark:text-amber-400/60 border border-amber-200/50 dark:border-amber-500/20';
    }
  }
}

function getCardBgClass(color: string, hasNote: boolean) {
  const c = COLOR_MAP[color] ?? 'amber';
  if (hasNote) return 'bg-white dark:bg-transparent border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50/50 dark:hover:bg-white/5';
  
  switch (c) {
    case 'blue':    return 'bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-500/5 dark:hover:bg-blue-500/10 border border-blue-200 dark:border-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/20';
    case 'emerald': return 'bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-500/20';
    case 'pink':    return 'bg-pink-50 hover:bg-pink-100/80 dark:bg-pink-500/5 dark:hover:bg-pink-500/10 border border-pink-200 dark:border-pink-500/10 hover:border-pink-300 dark:hover:border-pink-500/20';
    default:        return 'bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-500/5 dark:hover:bg-amber-500/10 border border-amber-200 dark:border-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/20';
  }
}

export default function ArticleNotesPanel({
  isOpen,
  onClose,
  articleTitle,
  annotations,
  onAddGeneralNote,
  onAnnotationDeleted,
  onScrollToAnnotation,
}: ArticleNotesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('Tất cả');
  const [panelWidth, setPanelWidth] = useState<number>(420);
  const [isCreatingGeneral, setIsCreatingGeneral] = useState(false);
  const [generalNoteText, setGeneralNoteText] = useState('');
  const [isSubmittingGeneral, setIsSubmittingGeneral] = useState(false);
  const isDragging = React.useRef(false);

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = React.useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = React.useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= Math.min(800, window.innerWidth - 100)) {
        setPanelWidth(newWidth);
      }
    }
  }, []);

  React.useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const filtered = annotations.filter(ann => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      ann.selectedText.toLowerCase().includes(searchLower) ||
      (ann.note?.toLowerCase().includes(searchLower) ?? false);

    const matchesType =
      filterType === 'Tất cả' ||
      (filterType === 'Ghi chú' && !!ann.note) ||
      (filterType === 'Highlight' && !ann.note);

    return matchesSearch && matchesType;
  }).sort((a, b) => {
    if (a.paragraphIndex === -1 && b.paragraphIndex !== -1) return -1;
    if (a.paragraphIndex !== -1 && b.paragraphIndex === -1) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleDelete = async (id: string) => {
    onAnnotationDeleted(id);
    try {
      await deleteAnnotationAction(id);
    } catch {}
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60_000) return 'Vừa xong';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
    return d.toLocaleDateString('vi-VN');
  };

  const handleSaveGeneralNote = async () => {
    if (!generalNoteText.trim() || !onAddGeneralNote) return;
    setIsSubmittingGeneral(true);
    try {
      await onAddGeneralNote(generalNoteText);
      setGeneralNoteText('');
      setIsCreatingGeneral(false);
    } finally {
      setIsSubmittingGeneral(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-800/40 dark:bg-black/40 backdrop-blur-sm z-[110]"
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full bg-white dark:bg-slate-900 border-l border-zinc-200 dark:border-white/10 z-[120] shadow-2xl flex flex-col overflow-hidden sm:max-w-none max-w-[100vw]"
            style={{ width: `${panelWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary z-50 transition-colors group"
              onMouseDown={startResizing}
            >
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-8 bg-zinc-300 dark:bg-zinc-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Header */}
            <div className="relative p-5 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between bg-zinc-50/50 dark:bg-slate-900/50">
              <div className="min-w-0 pr-4">
                <h2 className="text-[15px] font-black tracking-tight text-zinc-800 dark:text-zinc-100">Ghi chú cá nhân</h2>
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5 truncate uppercase tracking-wider">
                  {articleTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                title="Đóng lại"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="border-b border-zinc-200 dark:border-white/10 shrink-0 px-5 pt-4 pb-3 flex flex-col gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-100 focus:bg-white dark:bg-black/20 dark:focus:bg-black/40 border border-transparent focus:border-primary/50 dark:focus:border-primary/50 text-[13px] text-zinc-800 dark:text-zinc-200 rounded-lg pl-9 pr-8 py-2 outline-none transition-all placeholder:text-zinc-500"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full transition-transform"
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-5 w-full overflow-x-auto custom-scrollbar px-1 -mx-1">
                {(['Tất cả', 'Ghi chú', 'Highlight'] as FilterType[]).map(type => {
                  const isActive = filterType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`relative pb-2 text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                        isActive ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                      }`}
                    >
                      {type}
                      {isActive && (
                        <motion.div
                          layoutId="articleAnnotationTabFilter"
                          className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full z-10"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List */}
            <div className="relative flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-zinc-50/50 dark:bg-transparent">
              {onAddGeneralNote && (
                <div className="mb-4">
                  {!isCreatingGeneral ? (
                    <button
                      onClick={() => setIsCreatingGeneral(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-300 dark:border-white/20 rounded-xl text-[13px] font-bold text-zinc-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all outline-none"
                    >
                      <BookOpen className="w-4 h-4" /> Thêm ghi chú toàn bài
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-primary/20 shadow-sm space-y-2"
                    >
                      <textarea
                        autoFocus
                        value={generalNoteText}
                        onChange={e => setGeneralNoteText(e.target.value)}
                        placeholder="Nhập ghi chú tóm tắt bài viết..."
                        className="w-full min-h-[80px] bg-transparent text-[14px] text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none resize-none"
                      />
                      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/10">
                        <button
                          onClick={() => setIsCreatingGeneral(false)}
                          className="px-3 py-1.5 text-[12px] font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSaveGeneralNote}
                          disabled={!generalNoteText.trim() || isSubmittingGeneral}
                          className="px-3 py-1.5 text-[12px] font-bold bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          {isSubmittingGeneral ? 'Đang lưu...' : 'Lưu lại'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {filtered.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center py-10">
                  <div className="w-12 h-12 bg-white dark:bg-white/5 shadow-sm rounded-xl flex items-center justify-center mb-3 border border-zinc-200/50 dark:border-white/10">
                    <Search className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
                    {annotations.length === 0
                      ? 'Chưa có ghi chú nào.'
                      : 'Không tìm thấy kết quả.'}
                  </p>
                </div>
              ) : (
                filtered.map((ann, index) => (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    className={`p-3.5 rounded-xl space-y-2.5 group transition-colors duration-200 cursor-pointer ${getCardBgClass(ann.color, !!ann.note)}`}
                    onClick={() => onScrollToAnnotation(ann.id)}
                  >
                    {/* Header: Type & Time & Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${ann.paragraphIndex === -1 ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' : getBadgeClass(ann.color, !!ann.note)}`}>
                          {ann.paragraphIndex === -1 ? 'Ghi chú toàn bài' : ann.note ? 'Ghi chú' : 'Highlight'}
                        </span>
                        <span className="text-[11px] font-semibold text-zinc-400">
                          {formatTime(ann.createdAt)}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                         {ann.paragraphIndex !== -1 && (
                           <button
                             onClick={e => { e.stopPropagation(); onScrollToAnnotation(ann.id); }}
                             className="p-1 rounded-md text-zinc-400 hover:text-primary hover:bg-primary/10 transition-colors"
                             title="Đi tới đoạn"
                           >
                             <MapPin className="w-3.5 h-3.5" />
                           </button>
                         )}
                         <button
                           onClick={e => { e.stopPropagation(); handleDelete(ann.id); }}
                           className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                           title="Xóa"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </div>
                    </div>

                    {/* Highlight quote (skip if general note) */}
                    {ann.paragraphIndex !== -1 && (
                      <div className={`relative pl-3 border-l-[3px] ${getBorderClass(ann.color).split(' ')[0]} ${!ann.note ? 'opacity-90' : 'opacity-70'}`}>
                        <p className={`text-[15px] leading-relaxed break-words line-clamp-4 ${!ann.note ? 'text-zinc-800 dark:text-zinc-200 font-medium' : 'text-zinc-600 dark:text-zinc-400 italic'}`}>
                          {ann.selectedText}
                        </p>
                      </div>
                    )}

                    {/* Note content */}
                    {ann.note && (
                      <div className="pt-1 prose prose-zinc dark:prose-invert prose-p:text-[16px] prose-p:font-medium prose-p:text-zinc-800 dark:prose-p:text-zinc-100 prose-p:leading-relaxed max-w-none">
                        <MarkdownViewer content={ann.note} />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
