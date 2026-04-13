'use client';

import React, { useState, useTransition, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Loader2, Eye, Hash, Image as ImageIcon, 
  X, Settings, Maximize, Minimize, Columns, Edit3, ChevronRight,
  Info
} from 'lucide-react';
import type { TopicItem } from '@/features/admin/actions/topic';
import { createMemberArticleAction, updateMemberArticleAction } from '@/features/member/actions/write';
import EditorToolbar from '@/components/shared/editor/EditorToolbar';
import MarkdownPreview from '@/components/shared/editor/MarkdownPreview';

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

type ViewMode = 'editor' | 'split' | 'preview';

type EditData = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover: string;
  coverPosition: string;
  topicId: string;
  tags: string[];
};

interface Props {
  topics: TopicItem[];
  editArticle?: EditData;
}

export default function WritePageClient({ topics, editArticle }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!editArticle;

  const [title, setTitle] = useState(editArticle?.title ?? '');
  const [slug, setSlug] = useState(editArticle?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(!!editArticle);
  const [summary, setSummary] = useState(editArticle?.summary ?? '');
  const [content, setContent] = useState(editArticle?.content ?? '');
  const [topicId, setTopicId] = useState(editArticle?.topicId ?? '');
  const [tags, setTags] = useState<string[]>(editArticle?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [cover, setCover] = useState(editArticle?.cover ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugEdited) setSlug(toSlug(v));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const handleSave = () => {
    setError(null);
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề.'); return; }
    if (!content.trim()) { setError('Vui lòng nhập nội dung bài viết.'); return; }
    if (!topicId) { 
      setError('Vui lòng chọn chủ đề (trong phần thiết lập).'); 
      setIsSettingsOpen(true);
      return; 
    }

    const readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

    startTransition(async () => {
      const result = isEdit
        ? await updateMemberArticleAction(editArticle!.id, {
            title, slug, summary, content, topicId, tags, readTime,
            cover: cover || undefined, coverPosition: '50% 50%',
          })
        : await createMemberArticleAction({
            title, slug: slug || toSlug(title), summary, content, topicId, tags, readTime,
            cover: cover || undefined, coverPosition: '50% 50%',
          });

      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        if (!isEdit) router.push(`/write/${result.id}`);
      } else {
        setError(result.error);
      }
    });
  };

  const insertSyntax = useCallback((syntax: string, wrap = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const currentContent = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentContent.substring(start, end);
    let newContent: string;
    let cursorPos: number;

    if (wrap) {
      const inserted = `${syntax}${selected || 'text'}${syntax}`;
      newContent = currentContent.substring(0, start) + inserted + currentContent.substring(end);
      cursorPos = start + syntax.length + (selected || 'text').length + syntax.length;
    } else {
      const lineStart = currentContent.lastIndexOf('\n', start - 1) + 1;
      newContent = currentContent.substring(0, lineStart) + syntax + currentContent.substring(lineStart);
      cursorPos = lineStart + syntax.length + (end - lineStart);
    }

    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  }, []);

  // Flatten topics for select
  const flatTopics: { id: string; label: string; parentLabel?: string; color: string | null }[] = [];
  for (const parent of topics) {
    if (parent.children && parent.children.length > 0) {
      for (const child of parent.children) {
        flatTopics.push({ id: child.id, label: child.label, parentLabel: parent.label, color: child.color });
      }
    } else {
      flatTopics.push({ id: parent.id, label: parent.label, color: parent.color });
    }
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTimeEst = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className={`flex flex-col bg-white dark:bg-slate-950 transition-all duration-500 ${
      isFullscreen ? 'fixed inset-0 z-[100] h-screen' : 'min-h-[calc(100vh-64px)]'
    }`}>
      {/* HEADER BAR - Zen Style */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 shrink-0 border-b border-zinc-300 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-[40]">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-xl text-zinc-500 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-4 w-px bg-zinc-200 dark:bg-white/10 hidden sm:block" />
          <span className="text-xs font-black text-zinc-500 dark:text-slate-500 tracking-widest hidden sm:inline uppercase">
            {isEdit ? 'Chỉnh sửa' : 'Viết bài mới'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {error && <span className="hidden lg:inline text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-500/20">{error}</span>}
          {saved && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Đã lưu nháp</span>}
          
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 text-zinc-500 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2.5 rounded-xl transition-all ${isSettingsOpen ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5'}`}
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 dark:bg-primary text-white text-xs font-black tracking-widest hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-zinc-800/10 dark:shadow-primary/20 active:scale-95"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'CẬP NHẬT' : 'LƯU NHÁP'}
          </button>
        </div>
      </div>

      {/* MAIN EDITOR AREA */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Editor & Preview Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Editor Toolbar */}
          <EditorToolbar viewMode={viewMode} onViewChange={setViewMode} onInsert={insertSyntax} />
          
          <div className="flex-1 flex overflow-hidden">
            {/* WRITE SPACE */}
            {(viewMode === 'editor' || viewMode === 'split') && (
              <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2 border-r border-zinc-300 dark:border-white/5' : 'w-full'}`}>
                {/* Fixed Title area */}
                <div className="px-8 pt-8 pb-4 shrink-0">
                  <input
                    value={title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Tiêu đề bài viết..."
                    className="w-full text-3xl font-black bg-transparent border-none outline-none placeholder:text-zinc-200 dark:placeholder:text-slate-800 text-zinc-800 dark:text-white leading-tight"
                  />
                  <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-zinc-300 dark:text-slate-700">
                    <Hash className="w-3 h-3" />
                    <input
                      value={slug}
                      onChange={e => { setSlug(e.target.value); setSlugEdited(true); }}
                      placeholder="slug-duong-dan"
                      className="bg-transparent border-none outline-none text-zinc-500 dark:text-slate-600 flex-1 tabular-nums"
                    />
                  </div>
                </div>

                <div className="px-6 py-2 flex items-center gap-4 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] shrink-0">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Markdown Editor</span>
                  <div className="ml-auto flex items-center gap-4 text-[10px] font-bold text-zinc-300 dark:text-slate-600 uppercase tracking-tighter">
                    <span>{wordCount} từ</span>
                    <span>~{readTimeEst} phút đọc</span>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Bắt đầu viết cảm hứng của bạn bằng Markdown..."
                  className="flex-1 w-full p-8 pt-6 bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed text-zinc-800 dark:text-slate-200 placeholder:text-zinc-200 dark:placeholder:text-slate-800 scrollbar-thin scrollbar-thumb-zinc-100 dark:scrollbar-thumb-white/5"
                  spellCheck={false}
                />
              </div>
            )}

            {/* PREVIEW SPACE */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-hidden`}>
                <div className="px-6 py-2 flex items-center justify-between border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01]">
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Xem trước hiện tại</span>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <MarkdownPreview content={content} />
              </div>
            )}
          </div>
        </div>

        {/* SETTINGS SIDEBAR */}
        <div className={`absolute lg:relative right-0 top-0 h-full bg-white dark:bg-slate-900 border-l border-zinc-300 dark:border-white/5 transition-all duration-500 z-[30] origin-right ${
          isSettingsOpen ? 'w-full sm:w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        }`}>
          <div className="w-80 h-full flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Cấu hình bài viết</h5>
              <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-300 hover:text-rose-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Topic */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-500 dark:text-slate-400 uppercase tracking-wider">
                  <Hash className="w-3 h-3" /> Chủ đề
                </label>
                <select
                  value={topicId}
                  onChange={e => setTopicId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="">Chọn chủ đề...</option>
                  {flatTopics.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.parentLabel ? `${t.parentLabel} → ${t.label}` : t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cover */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-500 dark:text-slate-400 uppercase tracking-wider">
                  <ImageIcon className="w-3 h-3" /> Ảnh bìa (URL)
                </label>
                <input
                  value={cover}
                  onChange={e => setCover(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 p-3 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {cover && (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-300 dark:border-white/10 shadow-inner">
                    <img src={cover} className="w-full h-full object-cover" alt="Cover preview" />
                    <button onClick={() => setCover('')} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-rose-500 transition-colors backdrop-blur-md">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-500 dark:text-slate-400 uppercase tracking-wider">
                  <Info className="w-3 h-3" /> Từ khóa (Tags)
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl min-h-[50px]">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                      {tag}
                      <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-zinc-300 hover:text-rose-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="+ Thêm nhanh..."
                    className="flex-1 bg-transparent border-none outline-none text-[10px] font-bold text-zinc-500 min-w-[100px]"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-500 dark:text-slate-400 uppercase tracking-wider">
                  <Edit3 className="w-3 h-3" /> Tóm tắt bài viết
                </label>
                <textarea
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="Mô tả ngắn gọn về bài viết của bạn..."
                  rows={4}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 p-4 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="mt-auto pt-10 text-center">
              <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase tracking-widest">
                Trình soạn thảo chuẩn Zen <br />
                <span className="text-zinc-300 dark:text-slate-700">Lenote Premium Editor</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
