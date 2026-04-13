"use client";

import React, { useState, useRef, useCallback } from 'react';
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  Link2, Code, Image, Minus, List, ListOrdered,
  Quote, Eye, Columns, Edit3, ArrowLeft, ArrowRight, Target, ChevronDown, AlignLeft, Loader2, Youtube
} from 'lucide-react';
import MarkdownPreview from '@/components/shared/editor/MarkdownPreview';
import { uploadImage } from '@/lib/compress-image';

type ViewMode = 'editor' | 'split' | 'preview';

const formatActions = [
  { icon: Heading1, syntax: '# ', wrap: false },
  { icon: Heading2, syntax: '## ', wrap: false },
  { icon: Heading3, syntax: '### ', wrap: false },
  { divider: true },
  { icon: Bold, syntax: '**', wrap: true },
  { icon: Italic, syntax: '_', wrap: true },
  { icon: Quote, syntax: '> ', wrap: false },
  { divider: true },
  { icon: Code, syntax: '`', wrap: true },
  { icon: Link2, syntax: '[text](url)', wrap: false },
  { icon: Image, action: 'upload_image' },
  { icon: Youtube, action: 'embed_video' },
  { divider: true },
  { icon: List, syntax: '- ', wrap: false },
  { icon: ListOrdered, syntax: '1. ', wrap: false },
  { icon: Minus, syntax: '\n---\n', wrap: false },
];

interface Step2Props {
  title: string;
  content: string;
  overview: string;
  objectives: string;
  onContentChange: (v: string) => void;
  onOverviewChange: (v: string) => void;
  onObjectivesChange: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function ArticleStep2({ title, content, overview, objectives, onContentChange, onOverviewChange, onObjectivesChange, onBack, onNext }: Step2Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [objOpen, setObjOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [videoPromptOpen, setVideoPromptOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadImage(file, 1200, 900);
      insertSyntax(`\n![${file.name}](${url})\n`, false);
    } catch {
      // silent — có thể thêm toast sau
    } finally {
      setUploadingImage(false);
    }
  };

  const toEmbedUrl = (url: string): string | null => {
    // YouTube
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    // Vimeo
    const vi = url.match(/vimeo\.com\/(\d+)/);
    if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
    return null;
  };

  const handleInsertVideo = () => {
    const embed = toEmbedUrl(videoUrl.trim());
    if (!embed) return;
    insertSyntax(
      `\n<iframe src="${embed}" width="100%" style="aspect-ratio:16/9;border:0;border-radius:12px" allowfullscreen></iframe>\n`,
      false,
    );
    setVideoUrl('');
    setVideoPromptOpen(false);
  };

  const insertSyntax = useCallback((syntax: string, wrap = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
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
    onContentChange(newContent);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(cursorPos, cursorPos); }, 0);
  }, [content, onContentChange]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-300 dark:border-white/5 bg-transparent shrink-0">
        {/* Format buttons */}
        <div className="flex items-center gap-0.5 flex-1">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
            disabled={uploadingImage}
          />
          {formatActions.map((action, i) => {
            if ('divider' in action && action.divider) return <div key={i} className="w-px h-4 bg-zinc-200 dark:bg-white/10 mx-1" />;
            const Icon = action.icon!;
            const isImageBtn = action.action === 'upload_image';

            const isVideoBtn = action.action === 'embed_video';

            const handleClick = () => {
              if (isImageBtn) {
                if (!uploadingImage) fileInputRef.current?.click();
              } else if (isVideoBtn) {
                setVideoPromptOpen(v => !v);
              } else if (action.syntax) {
                insertSyntax(action.syntax, action.wrap);
              }
            };

            return (
              <button key={i} onClick={handleClick} disabled={isImageBtn && uploadingImage}
                className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 ${isVideoBtn && videoPromptOpen ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'}`}>
                {isImageBtn && uploadingImage
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Icon className="w-3.5 h-3.5" />
                }
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-zinc-100 dark:bg-white/5 rounded-xl p-1 gap-0.5 shrink-0">
          {([
            { mode: 'editor' as ViewMode, icon: Edit3, label: 'Editor' },
            { mode: 'split' as ViewMode, icon: Columns, label: 'Split' },
            { mode: 'preview' as ViewMode, icon: Eye, label: 'Preview' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button key={mode} title={label} onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === mode ? 'bg-white dark:bg-slate-700 text-zinc-800 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300'
              }`}>
              <Icon className="w-3 h-3" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Video URL prompt panel */}
      {videoPromptOpen && (
        <div className="shrink-0 border-b border-zinc-300 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] px-4 py-3 flex items-center gap-2 animate-in slide-in-from-top-1 fade-in duration-150">
          <Youtube className="w-4 h-4 text-rose-500 shrink-0" />
          <input
            type="url"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleInsertVideo(); if (e.key === 'Escape') setVideoPromptOpen(false); }}
            placeholder="Dán link YouTube hoặc Vimeo..."
            autoFocus
            className="flex-1 text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-800 dark:text-slate-200 placeholder:text-zinc-500"
          />
          <button
            onClick={handleInsertVideo}
            disabled={!videoUrl.trim()}
            className="px-3 py-1.5 text-xs font-bold bg-zinc-800 dark:bg-primary text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-40"
          >
            Chèn
          </button>
          <button
            onClick={() => { setVideoPromptOpen(false); setVideoUrl(''); }}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <span className="text-xs">✕</span>
          </button>
        </div>
      )}

      {/* Summary collapsible panel */}
      <div className="shrink-0 border-b border-zinc-300 dark:border-white/5 bg-transparent">
        <button
          onClick={() => setSummaryOpen(v => !v)}
          className="w-full flex items-center gap-2 px-4 py-2 text-left text-xs font-bold text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
        >
          <AlignLeft className="w-3.5 h-3.5 text-primary" />
          <span className="text-primary/80">Tóm tắt bài viết</span>
          {overview && !summaryOpen && (
            <span className="ml-2 text-[10px] text-zinc-500 font-normal truncate max-w-xs">{overview}</span>
          )}
          <ChevronDown className={`ml-auto w-3.5 h-3.5 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
        </button>
        {summaryOpen && (
          <div className="px-4 pb-3">
            <textarea
              value={overview}
              onChange={e => onOverviewChange(e.target.value)}
              rows={3}
              placeholder="Tóm tắt nội dung bài viết, hiển thị trong box nổi bật đầu bài..."
              className="w-full text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-zinc-800 dark:text-slate-200 placeholder:text-zinc-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* Objectives collapsible panel */}
      <div className="shrink-0 border-b border-zinc-300 dark:border-white/5 bg-transparent">
        <button
          onClick={() => setObjOpen(v => !v)}
          className="w-full flex items-center gap-2 px-4 py-2 text-left text-xs font-bold text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
        >
          <Target className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400">Mục tiêu bài viết</span>
          {objectives && !objOpen && (
            <span className="ml-2 text-[10px] text-zinc-500 font-normal truncate max-w-xs">{objectives.split('\n')[0]}</span>
          )}
          <ChevronDown className={`ml-auto w-3.5 h-3.5 transition-transform ${objOpen ? 'rotate-180' : ''}`} />
        </button>
        {objOpen && (
          <div className="px-4 pb-3">
            <textarea
              value={objectives}
              onChange={e => onObjectivesChange(e.target.value)}
              rows={4}
              placeholder={`- Hiểu được kiến trúc X\n- Biết cách triển khai Y\n- Áp dụng được Z vào thực tế`}
              className="w-full text-sm font-mono bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none text-zinc-800 dark:text-slate-200 placeholder:text-zinc-500 transition-all"
            />
            <p className="text-[11px] text-zinc-500 mt-1">Dùng <code className="bg-zinc-100 dark:bg-white/10 px-1 rounded">-</code> để tạo danh sách. Hiển thị dạng box nổi bật đầu bài.</p>
          </div>
        )}
      </div>

      {/* Editor + Preview */}
      <div className="flex flex-1 overflow-hidden">
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2 border-r border-zinc-300 dark:border-white/5' : 'flex-1'}`}>
            <div className="flex items-center px-4 py-2 bg-transparent border-b border-zinc-200 dark:border-white/5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Markdown</span>
              <span className="ml-auto text-[10px] text-zinc-500">{content.length} ký tự</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="flex-1 w-full resize-none p-6 font-mono text-sm leading-relaxed outline-none bg-transparent text-zinc-800 dark:text-slate-200 placeholder:text-zinc-300"
              spellCheck={false}
              placeholder="Bắt đầu viết nội dung Markdown ở đây..."
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2' : 'flex-1'} overflow-hidden`}>
            <div className="flex items-center px-4 py-2 bg-transparent border-b border-zinc-200 dark:border-white/5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Preview</span>
            </div>
            <div className="flex-1 overflow-hidden"><MarkdownPreview content={content} /></div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="px-6 py-4 bg-transparent border-t border-zinc-300 dark:border-white/5 shrink-0 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20 transition-all">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <button onClick={onNext} className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-zinc-800 dark:bg-primary text-white text-sm font-bold hover:opacity-90 transition-all">
          Tiếp theo <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
