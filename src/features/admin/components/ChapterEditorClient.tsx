'use client';

import React, { useState, useTransition, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Maximize, Minimize, Type, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateChapterAction, createChapterAction, type ChapterFormData } from '@/features/admin/actions/book';
import { slugify } from '@/lib/slugify';
import EditorToolbar from '@/components/shared/editor/EditorToolbar';
import MarkdownPreview from '@/components/shared/editor/MarkdownPreview';

type Chapter = { id: string; title: string; slug: string; order: number; isFree: boolean; content?: string; readTime?: number };
type Book    = { id: string; title: string; slug: string; chapters: Chapter[] };
type ViewMode = 'editor' | 'split' | 'preview';

export default function ChapterEditorClient({ book, chapter }: { book: Book, chapter: Chapter | null }) {
  const router = useRouter();

  const defaultOrder = book.chapters.length + 1;
  const defaultTitle = `Chương ${defaultOrder}`;

  const [form, setForm] = useState<ChapterFormData>({
    title: chapter?.title || defaultTitle,
    slug: chapter?.slug || (chapter ? '' : slugify(defaultTitle)),
    content: chapter?.content || '',
    order: chapter?.order || defaultOrder,
    isFree: chapter?.isFree || false,
    readTime: chapter?.readTime || 5, // Default read time 5 min
  });

  const [formError, setFormError] = useState('');
  const [formPending, startFormTransition] = useTransition();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setF = (k: keyof ChapterFormData, v: any) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === 'title' && !chapter) next.slug = slugify(v as string);
      return next;
    });
  };

  const handleSave = () => {
    if (!form.title.trim()) { 
      setFormError('Tiêu đề chương không được để trống.');
      return; 
    }
    setFormError('');
    startFormTransition(async () => {
      if (!chapter) {
        const res = await createChapterAction(book.id, form);
        if (!res.success) { setFormError(res.error); return; }
        router.push(`/admin/books/${book.id}/chapters`);
        router.refresh();
      } else {
        const res = await updateChapterAction(chapter.id, form);
        if (!res.success) { setFormError(res.error); return; }
        router.push(`/admin/books/${book.id}/chapters`);
        router.refresh();
      }
    });
  };

  const insertSyntax = useCallback((syntax: string, wrap = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const content = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    let newContent: string;
    let cursorPos: number;

    if (wrap) {
      const inserted = `${syntax}${selected || 'text'}${syntax}`;
      newContent = content.substring(0, start) + inserted + content.substring(end);
      cursorPos = start + syntax.length + (selected || 'text').length + syntax.length;
    } else {
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      newContent = content.substring(0, lineStart) + syntax + content.substring(lineStart);
      cursorPos = lineStart + syntax.length + (end - lineStart);
    }

    setForm(f => ({ ...f, content: newContent }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  }, []);

  return (
    <div className={
      isFullscreen
        ? "fixed inset-0 z-[100] bg-zinc-50 dark:bg-slate-900 flex flex-col h-screen overflow-hidden animate-in fade-in duration-200"
        : "flex-1 flex flex-col w-full h-full overflow-hidden bg-zinc-50 dark:bg-slate-900 relative"
    }>
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-zinc-300 dark:border-white/5 bg-transparent z-10">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link 
            href={`/admin/books/${book.id}/chapters`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 text-zinc-500 hover:text-primary transition-all shrink-0 tooltip-trigger shadow-sm group"
            title="Thoát về danh sách chương"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Quay lại</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-500 flex-1 min-w-0 pr-4">
            <span className="hidden sm:inline shrink-0 font-bold bg-zinc-200 dark:bg-white/10 px-3 py-1.5 rounded-lg text-zinc-600 dark:text-slate-300 shadow-inner">
              {book.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {formError && (
            <span className="hidden md:inline text-[11px] text-rose-500 font-bold px-4 py-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl mr-2 uppercase tracking-wider shadow-sm animate-in fade-in slide-in-from-right-4">
              {formError}
            </span>
          )}
          
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-3 text-zinc-500 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all font-bold group bg-white dark:bg-transparent shadow-sm border border-zinc-300 dark:border-transparent"
            title={isFullscreen ? "Thu nhỏ (Thoát toàn màn hình)" : "Phóng to toàn màn hình"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 group-hover:scale-110 transition-transform" /> : <Maximize className="w-4 h-4 group-hover:scale-110 transition-transform" />}
          </button>

          <button onClick={handleSave} disabled={formPending} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 dark:bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-zinc-800/10 dark:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0">
            <Save className="w-4 h-4" />
            {formPending ? 'Đang lưu...' : (!chapter ? 'Tạo' : 'Lưu bản nháp')}
          </button>
        </div>
      </div>

      {/* TOOLBAR & TITLE */}
      <div className="shrink-0 bg-transparent">
        <EditorToolbar viewMode={viewMode} onViewChange={setViewMode} onInsert={insertSyntax} />
        
        {/* Inline Title Input */}
        <div className="px-6 py-2 bg-transparent border-b border-zinc-200 dark:border-white/5">
          <input 
            value={form.title}
            onChange={e => setF('title', e.target.value)}
            placeholder="Nhập tiêu đề chương..."
            className="w-full text-lg font-bold text-zinc-800 dark:text-white bg-transparent border-none outline-none placeholder:text-zinc-300 dark:placeholder:text-slate-600 transition-all px-0"
          />
        </div>
      </div>

      {/* EDITOR & PREVIEW */}
      <div className="flex flex-1 overflow-hidden">
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2 border-r border-zinc-300 dark:border-white/5' : 'flex-1'} bg-transparent`}>
            <div className="flex items-center px-4 py-2 bg-transparent border-b border-zinc-200 dark:border-white/5 shrink-0 z-10">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Markdown
              </span>
              <span className="ml-auto text-[10px] text-zinc-500">{form.content?.length || 0} ký tự</span>
            </div>
            <textarea
              ref={textareaRef}
              value={form.content}
              onChange={e => setF('content', e.target.value)}
              className="flex-1 w-full resize-none p-6 font-mono text-sm leading-relaxed outline-none bg-transparent text-zinc-800 dark:text-slate-200 placeholder:text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10"
              spellCheck={false}
              placeholder="# Bắt đầu viết nội dung chương của bạn...&#10;&#10;Sử dụng Markdown để tạo heading, chèn code, bảng, ảnh... như bình thường."
            />
          </div>
        )}
        
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2' : 'flex-1'} overflow-hidden`}>
            <div className="flex items-center px-4 py-2 bg-transparent border-b border-zinc-200 dark:border-white/5 shrink-0 z-10">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Live Preview
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <MarkdownPreview content={form.content || ''} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
