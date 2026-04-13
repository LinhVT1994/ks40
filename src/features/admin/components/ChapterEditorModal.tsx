'use client';

import React, { useState } from 'react';
import { X, Save, Eye, Edit3, Type, Globe, Lock, Info } from 'lucide-react';

type ChapterEditorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  chapter?: { id: string; title: string; content?: string; isFree: boolean };
};

export default function ChapterEditorModal({ isOpen, onClose, chapter }: ChapterEditorModalProps) {
  const [title, setTitle] = useState(chapter?.title || '');
  const [content, setContent] = useState(chapter?.content || '');
  const [isFree, setIsFree] = useState(chapter?.isFree || false);
  const [view, setView] = useState<'edit' | 'preview'>('edit');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-800/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-full max-h-[90vh] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
        
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-800 dark:text-white font-display">
                {chapter ? 'Sửa Chapter' : 'Thêm Chapter Mới'}
              </h2>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Soạn thảo nội dung Markdown</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
               onClick={onClose}
               className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
             >
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Controls */}
          <div className="px-8 py-4 bg-white dark:bg-slate-900 border-b border-zinc-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
             <div className="flex-1 max-w-md relative group">
                <Type className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tiêu đề chương..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white font-bold"
                />
             </div>

             <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 p-1 rounded-2xl">
                <button 
                  onClick={() => setView('edit')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${view === 'edit' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Soạn thảo
                </button>
                <button 
                  onClick={() => setView('preview')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${view === 'preview' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  <Eye className="w-3.5 h-3.5" /> Xem trước
                </button>
             </div>

             <button 
               onClick={() => setIsFree(!isFree)}
               className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                 isFree 
                   ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' 
                   : 'bg-zinc-50 border-zinc-200 text-zinc-500 dark:bg-white/5 dark:border-white/5 dark:text-slate-500 hover:border-zinc-300'
               }`}
             >
               {isFree ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
               Miễn phí: {isFree ? 'BẬT' : 'TẮT'}
             </button>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative overflow-hidden">
            {view === 'edit' ? (
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung markdown tại đây..."
                className="w-full h-full p-8 text-sm bg-transparent outline-none dark:text-slate-300 font-mono leading-relaxed resize-none placeholder:text-zinc-300 dark:placeholder:text-slate-700"
              />
            ) : (
              <div className="w-full h-full p-8 overflow-y-auto prose prose-slate dark:prose-invert max-w-none">
                {content ? (
                   <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h1>{title || 'Tiêu đề chương'}</h1>
                      <p>{content}</p>
                      <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10 text-xs text-primary font-medium flex items-center gap-3">
                         <Info className="w-4 h-4" /> Bản xem trước nội dung sẽ hiển thị chính xác hơn khi lưu.
                      </div>
                   </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-300 dark:text-white/10 italic">
                    <p>Chưa có nội dung để xem trước</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-5 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-white/[0.02]">
           <p className="text-[10px] text-zinc-500 font-medium italic">
             Mẹo: Sử dụng Markdown để trình bày mã nguồn, bảng và định dạng văn bản.
           </p>
           <div className="flex items-center gap-3">
             <button 
               onClick={onClose}
               className="px-6 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
             >
               Hủy bỏ
             </button>
             <button 
               className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
             >
               <Save className="w-4 h-4" /> Lưu Chapter
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}
