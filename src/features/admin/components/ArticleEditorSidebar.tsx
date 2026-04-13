"use client";

import React from 'react';
import { Send, Save, ImagePlus } from 'lucide-react';

const categories = ['System Design', 'AI / ML', 'DevOps', 'Blockchain', 'Frontend', 'Backend', 'Other'];

interface ArticleEditorSidebarProps {
  title: string;
  slug: string;
  category: string;
  status: 'draft' | 'published';
  summary: string;
  onTitleChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onStatusChange: (v: 'draft' | 'published') => void;
  onSummaryChange: (v: string) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
}

export default function ArticleEditorSidebar({
  title, category, status, summary,
  onTitleChange, onCategoryChange, onStatusChange, onSummaryChange, onPublish, onSaveDraft
}: ArticleEditorSidebarProps) {
  return (
    <div className="border-b border-zinc-300 dark:border-white/5 bg-white dark:bg-slate-950 shrink-0 px-8 py-6">
      <div className="flex gap-6">

        {/* Cover image upload */}
        <div className="flex flex-col items-center justify-center gap-2 w-36 h-28 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-white/10 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group shrink-0">
          <ImagePlus className="w-6 h-6 text-zinc-300 group-hover:text-primary transition-colors" />
          <span className="text-xs text-zinc-500 group-hover:text-primary font-medium transition-colors">Ảnh bìa</span>
        </div>

        {/* Fields */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Row 1: Title */}
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Tiêu đề bài viết..."
            className="w-full text-lg font-semibold bg-transparent outline-none dark:text-white placeholder:text-zinc-300 dark:placeholder:text-slate-600 border-b border-zinc-200 dark:border-white/10 focus:border-primary/50 transition-all pb-2"
          />

          {/* Row 2: Category + Status + Summary + Actions */}
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:text-slate-300 cursor-pointer"
            >
              <option value="">Chủ đề...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="flex items-center bg-zinc-100 dark:bg-white/5 rounded-xl p-1 gap-1">
              {(['draft', 'published'] as const).map(s => (
                <button key={s} onClick={() => onStatusChange(s)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    status === s
                      ? s === 'published'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-700 text-zinc-700 dark:text-slate-200 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300'
                  }`}>
                  {s === 'draft' ? 'Nháp' : 'Xuất bản'}
                </button>
              ))}
            </div>

            <input
              value={summary}
              onChange={(e) => onSummaryChange(e.target.value)}
              placeholder="Tóm tắt ngắn..."
              className="flex-1 min-w-[160px] text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-zinc-500"
            />

            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button onClick={onSaveDraft}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold border border-zinc-300 dark:border-white/10 text-zinc-500 dark:text-slate-400 hover:border-primary/50 hover:text-primary transition-all">
                <Save className="w-4 h-4" /> Lưu nháp
              </button>
              <button onClick={onPublish}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-accent-purple text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                <Send className="w-4 h-4" /> Xuất bản
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
