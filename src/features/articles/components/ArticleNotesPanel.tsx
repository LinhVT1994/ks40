'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileEdit, Trash2, MapPin, Search } from 'lucide-react';
import type { ArticleAnnotation } from '@/features/articles/actions/annotation';
import { deleteAnnotationAction } from '@/features/articles/actions/annotation';

interface ArticleNotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  articleTitle: string;
  annotations: ArticleAnnotation[];
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
  if (hasNote) return 'bg-white dark:bg-white/5 border border-zinc-300/60 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20';
  switch (c) {
    case 'blue':    return 'bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-500/5 dark:hover:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/20';
    case 'emerald': return 'bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-500/20';
    case 'pink':    return 'bg-pink-50/50 hover:bg-pink-50 dark:bg-pink-500/5 dark:hover:bg-pink-500/10 border border-pink-200/60 dark:border-pink-500/10 hover:border-pink-300 dark:hover:border-pink-500/20';
    default:        return 'bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-500/5 dark:hover:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/20';
  }
}

export default function ArticleNotesPanel({
  isOpen,
  onClose,
  articleTitle,
  annotations,
  onAnnotationDeleted,
  onScrollToAnnotation,
}: ArticleNotesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('Tất cả');

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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[400px] bg-zinc-50 dark:bg-slate-900 border-l border-zinc-300 dark:border-white/10 z-[120] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-300 dark:border-white/10 flex items-center justify-between bg-white dark:bg-slate-900/50">
              <div>
                <h2 className="text-xl font-black text-zinc-800 dark:text-white">Ghi chú & Highlight</h2>
                <p className="text-xs font-bold text-zinc-500 mt-1 truncate w-64 uppercase tracking-widest">
                  {articleTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-zinc-500 dark:text-slate-400 dark:hover:text-white transition-all hover:scale-105 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="border-b border-zinc-300 dark:border-white/10 bg-white/50 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 shrink-0 px-5 pt-4 pb-3 flex flex-col gap-3">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm ghi chú hoặc nội dung trích dẫn..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-black/20 border border-transparent focus:border-primary/50 dark:focus:border-primary/50 text-[13px] text-zinc-800 dark:text-slate-200 rounded-xl pl-10 pr-10 py-2.5 outline-none transition-all placeholder:text-zinc-500"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-200 bg-white dark:bg-white/10 rounded-md shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-white/10 w-full overflow-x-auto custom-scrollbar pt-3 px-1 -mx-1">
                {(['Tất cả', 'Ghi chú', 'Highlight'] as FilterType[]).map(type => {
                  const isActive = filterType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`relative pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${
                        isActive ? 'text-primary' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {type}
                      {isActive && (
                        <motion.div
                          layoutId="articleAnnotationTabFilter"
                          className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-full z-10"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-zinc-50/50 dark:bg-transparent custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center">
                  <div className="w-10 h-10 bg-white dark:bg-white/5 shadow-sm rounded-xl flex items-center justify-center mb-3">
                    <Search className="w-5 h-5 text-zinc-500" />
                  </div>
                  <p className="text-[13px] font-medium">
                    {annotations.length === 0
                      ? 'Chưa có ghi chú nào. Chọn văn bản để bắt đầu.'
                      : `Không tìm thấy kết quả khớp với "${searchQuery}"`}
                  </p>
                </div>
              ) : (
                filtered.map((ann, index) => (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`p-3.5 rounded-xl space-y-2 shadow-sm hover:shadow-md dark:shadow-none group transition-all duration-200 cursor-pointer ${getCardBgClass(ann.color, !!ann.note)}`}
                    onClick={() => onScrollToAnnotation(ann.id)}
                  >
                    {/* Highlight quote */}
                    <div className="flex items-center gap-2 opacity-70">
                      <div className={`w-1 h-3 rounded-full ${getBorderClass(ann.color).split(' ')[0].replace('border-', 'bg-')}`} />
                      <p className={`text-[11px] font-serif italic truncate flex-1 leading-none pt-0.5 ${!ann.note ? 'text-zinc-800 dark:text-slate-200 font-medium not-italic' : ''}`}>
                        &ldquo;{ann.selectedText}&rdquo;
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded uppercase tracking-widest font-black ${getBadgeClass(ann.color, !!ann.note)}`}>
                          {ann.note ? 'Ghi chú' : 'Highlight'}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                          {formatTime(ann.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Note content */}
                    {ann.note && (
                      <p className="text-[13px] font-medium text-zinc-800 dark:text-slate-200 leading-snug pt-1">
                        {ann.note}
                      </p>
                    )}

                    {/* Hover actions */}
                    <div className="flex items-center justify-between pt-1 overflow-hidden h-0 group-hover:h-6 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={e => { e.stopPropagation(); onScrollToAnnotation(ann.id); }}
                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" /> Đi tới đoạn
                      </button>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(ann.id); }}
                          className="p-1 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-md text-zinc-500 hover:text-red-500 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-300 dark:border-white/10 bg-white dark:bg-slate-900 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">KS4.0 Personal Notes</span>
              <span className="text-[10px] font-bold text-zinc-400">{annotations.length} ghi chú</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
