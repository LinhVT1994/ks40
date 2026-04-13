'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileEdit, Trash2, Clock, MapPin, Search } from 'lucide-react';

interface ChapterNotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle: string;
}

const mockNotes = [
  {
    id: '0',
    isGeneral: true,
    highlightText: '',
    content: 'Chương này chủ yếu nói về Mindset của một Senior. Về cơ bản là phải luôn tự hỏi "Under the hood" nó chạy thế nào, thay vì chỉ biết gõ code ăn liền. Tuyệt đối áp dụng nguyên tắc DRY vào project của cty ngày mai.',
    color: 'slate',
    time: 'Vừa xong'
  },
  {
    id: '1',
    highlightText: 'các khái niệm quan trọng',
    content: 'Đây là một khái niệm cực kỳ quan trọng, cần nắm vững để có thể tối ưu hóa hiệu năng hệ thống sau này.',
    color: 'amber',
    time: '2 phút trước'
  },
  {
    id: '2',
    highlightText: 'hiểu bản chất vận hành của hệ thống',
    content: 'Senior không chỉ dùng tool, mà phải hiểu under-the-hood. Cần note lại để research sâu hơn về Event Loop và Memory Management trong V8.',
    color: 'blue',
    time: '45 phút trước'
  },
  {
    id: '3',
    highlightText: 'Practice = 10000 giờ',
    content: 'Quy tắc 10.000 giờ của Malcolm Gladwell. Tuy nhiên, sự tập trung (focus) còn quan trọng hơn cả số lượng giờ bay.',
    color: 'emerald',
    time: 'Hôm qua'
  },
  {
    id: '4',
    highlightText: 'Đừng lặp lại chính mình (DRY) là quy tắc vàng của Software Engineering.',
    content: '', // Pure highlight, no note attached
    color: 'blue',
    time: '2 ngày trước'
  }
];

export default function ChapterNotesPanel({ isOpen, onClose, chapterTitle }: ChapterNotesPanelProps) {
  type FilterType = 'Tất cả' | 'Ghi chú chung' | 'Ghi chú' | 'Highlight';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('Tất cả');
  
  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'border-blue-500/50 text-blue-400';
      case 'emerald': return 'border-emerald-500/50 text-emerald-400';
      case 'slate': return 'border-zinc-500/50 text-zinc-500';
      default: return 'border-amber-500/50 text-amber-400';
    }
  };

  const getBadgeClass = (color: string, hasContent: boolean) => {
    if (hasContent) {
      switch (color) {
        case 'blue': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
        case 'emerald': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
        case 'slate': return 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-slate-300';
        default: return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
      }
    } else {
      switch (color) {
        case 'blue': return 'bg-blue-50/50 text-blue-500/80 dark:bg-blue-500/10 dark:text-blue-400/60 border border-blue-200/50 dark:border-blue-500/20';
        case 'emerald': return 'bg-emerald-50/50 text-emerald-500/80 dark:bg-emerald-500/10 dark:text-emerald-400/60 border border-emerald-200/50 dark:border-emerald-500/20';
        case 'slate': return 'bg-zinc-50/50 text-zinc-500/80 dark:bg-white/5 dark:text-slate-400/60 border border-zinc-200 dark:border-white/10';
        default: return 'bg-amber-50/50 text-amber-500/80 dark:bg-amber-500/10 dark:text-amber-400/60 border border-amber-200/50 dark:border-amber-500/20';
      }
    }
  };

  const filteredNotes = mockNotes.filter(note => {
    // 1. Text Search Match
    const searchLower = searchQuery.toLowerCase();
    const contentMatch = note.content ? note.content.toLowerCase().includes(searchLower) : false;
    const highlightMatch = note.highlightText ? note.highlightText.toLowerCase().includes(searchLower) : false;
    const matchesSearch = !searchQuery || contentMatch || highlightMatch;
      
    // 2. Type Match
    let matchesType = true;
    if (filterType === 'Ghi chú chung') {
      matchesType = !!note.isGeneral;
    } else if (filterType === 'Ghi chú') {
      matchesType = !!note.content;
    } else if (filterType === 'Highlight') {
      matchesType = !!note.highlightText;
    }

    return matchesSearch && matchesType;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-800/40 dark:bg-black/40 backdrop-blur-sm z-[110]"
          />

          {/* Panel */}
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
                <p className="text-xs font-bold text-zinc-500 mt-1 truncate w-64 uppercase tracking-widest">{chapterTitle}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-zinc-500 dark:text-slate-400 dark:hover:text-white transition-all hover:scale-105 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar, Add Button, & Type Filters */}
            <div className="border-b border-zinc-300 dark:border-white/10 bg-white/50 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 shrink-0 px-5 pt-4 pb-3 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="relative group flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Tìm ghi chú hoặc nội dung trích dẫn..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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

                {/* Add General Note Button */}
                <button title="Thêm ghi chú chung cho chương" className="p-2.5 shrink-0 bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 text-primary border border-primary/20 dark:border-primary/30 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center">
                   <FileEdit className="w-4 h-4" />
                </button>
              </div>

              {/* Modern Minimalist Animated Tabs */}
              <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-white/10 w-full overflow-x-auto custom-scrollbar pt-3 px-1 -mx-1">
                {(['Tất cả', 'Ghi chú chung', 'Ghi chú', 'Highlight'] as FilterType[]).map(type => {
                  const isActive = filterType === type;
                  return (
                    <button 
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`relative pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${
                        isActive 
                          ? 'text-primary' 
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {type}
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabFilter"
                          className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-full z-10"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-zinc-50/50 dark:bg-transparent custom-scrollbar">
              {filteredNotes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center">
                  <div className="w-10 h-10 bg-white dark:bg-white/5 shadow-sm rounded-xl flex items-center justify-center mb-3">
                    <Search className="w-5 h-5 text-zinc-500" />
                  </div>
                  <p className="text-[13px] font-medium">Không tìm thấy kết quả nào khớp với "{searchQuery}"</p>
                </div>
              ) : (
                filteredNotes.map((note, index) => {
                  
                  const getCardBgClass = (color: string, isGeneral?: boolean, hasContent?: boolean) => {
                    if (isGeneral) return 'bg-white dark:bg-white/5 border border-primary/30 shadow-primary/5 dark:border-primary/40 hover:border-primary/50';
                    if (hasContent) return 'bg-white dark:bg-white/5 border border-zinc-300/60 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20';
                    
                    switch (color) {
                      case 'blue': return 'bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-500/5 dark:hover:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/20';
                      case 'emerald': return 'bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-500/20';
                      default: return 'bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-500/5 dark:hover:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/20';
                    }
                  };

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={note.id} 
                      className={`p-3.5 rounded-xl space-y-2 shadow-sm hover:shadow-md dark:shadow-none group transition-all duration-200 cursor-pointer ${getCardBgClass(note.color, note.isGeneral, !!note.content)}`}
                    >
                      
                      {note.isGeneral ? (
                        // 1. Compact General Note Layout
                        <>
                          <div className="flex items-center gap-2 opacity-80">
                            <div className={`w-1 h-3 rounded-full bg-primary/70`} />
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[8.5px] px-1.5 py-0.5 rounded uppercase tracking-widest font-black bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300`}>
                                Ghi chú chương
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{note.time}</span>
                            </div>
                          </div>
                          <p className="text-[13px] font-medium text-zinc-800 dark:text-slate-200 leading-snug">
                            {note.content}
                          </p>
                        </>
                      ) : (
                        // 2. Specific Highlight/Note Layout
                        <>
                          {/* Compact Highlight Context */}
                          <div className="flex items-center gap-2 opacity-60">
                            <div className={`w-1 h-3 rounded-full ${getColorClass(note.color).split(' ')[0].replace('border-', 'bg-')}`} />
                            <p className={`text-[11px] font-serif italic truncate flex-1 leading-none pt-0.5 ${!note.content ? 'text-zinc-800 dark:text-slate-200 font-medium not-italic' : ''}`}>
                              "{note.highlightText}"
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[8.5px] px-1.5 py-0.5 rounded uppercase tracking-widest font-black ${getBadgeClass(note.color, !!note.content)}`}>
                                {note.content ? 'Ghi chú' : 'Highlight'}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{note.time}</span>
                            </div>
                          </div>

                          {/* Compact Note Content (Only if exists) */}
                          {note.content && (
                            <p className="text-[13px] font-medium text-zinc-800 dark:text-slate-200 leading-snug pt-1">
                              {note.content}
                            </p>
                          )}
                        </>
                      )}

                      {/* Compact Hover Actions */}
                      <div className="flex items-center justify-between pt-1 overflow-hidden h-0 group-hover:h-6 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        {!note.isGeneral ? (
                          <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Đi tới đoạn
                          </button>
                        ) : (
                          <div /> // Placeholder to align icons right
                        )}
                        
                        <div className="flex items-center gap-0.5">
                          <button className="p-1 hover:bg-zinc-800/5 dark:hover:bg-white/10 rounded-md text-zinc-500 hover:text-primary transition-colors" title={note.content ? "Chỉnh sửa" : "Thêm ghi chú"}>
                            <FileEdit className="w-3 h-3" />
                          </button>
                          <button className="p-1 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-md text-zinc-500 hover:text-red-500 transition-colors" title="Xóa">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-zinc-300 dark:border-white/10 bg-white dark:bg-slate-900 flex justify-center">
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">KS4.0 Personal Notes</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
