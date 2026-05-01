'use client';

import React, { useState, useRef, useCallback, useEffect, useDeferredValue } from 'react';
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  Link2, Code, Image as ImageIcon, Minus, List, ListOrdered,
  Quote, Eye, Columns, Edit3, Target, ChevronDown, AlignLeft, Loader2, Youtube
} from 'lucide-react';
import MarkdownPreview from '@/components/shared/editor/MarkdownPreview';
import ArticleHero from '@/features/member/components/ArticleHero';
import ArticleContent from '@/features/member/components/ArticleContent';
import type { TopicItem } from '@/features/admin/actions/topic';
import type { ArticleFull } from '@/features/articles/actions/article';
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
  { icon: ImageIcon, action: 'upload_image' },
  { icon: Youtube, action: 'embed_video' },
  { divider: true },
  { icon: List, syntax: '- ', wrap: false },
  { icon: ListOrdered, syntax: '1. ', wrap: false },
  { icon: Minus, syntax: '\n---\n', wrap: false },
];

interface Step2Props {
  title: string;
  content: string; setContent: (v: string) => void;
  overview: string; setOverview: (v: string) => void;
  objectives: string; setObjectives: (v: string) => void;
  topic?: TopicItem;
  tags: string[];
  cover: string;
  coverPosition: string;
  thumbnail: string;
  thumbnailPosition: string;
  author?: { name: string; image?: string };
  onBack: () => void;
  onNext: () => void;
}

export default function MemberStep2({
  title, content, setContent, overview, setOverview, objectives, setObjectives, 
  topic, tags, cover, coverPosition, thumbnail, thumbnailPosition, author,
  onBack, onNext
}: Step2Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [objOpen, setObjOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [videoPromptOpen, setVideoPromptOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [metadataHeight, setMetadataHeight] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
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
      // silent
    } finally {
      setUploadingImage(false);
    }
  };

  const toEmbedUrl = (url: string): string | null => {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
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

  // Resize logic
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newHeight = e.clientY - 120; // 120 is the approximate offset from top header
    if (newHeight > 40 && newHeight < 600) {
      setMetadataHeight(newHeight);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

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
    setContent(newContent);
    setTimeout(() => { 
      textarea.focus({ preventScroll: true }); 
      textarea.setSelectionRange(cursorPos, cursorPos); 
    }, 0);
  }, [content, setContent]);
  
  const readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

  const mockArticle: ArticleFull = {
    id: 'preview',
    title: title || 'Tiêu đề bài viết',
    slug: 'preview',
    summary: overview,
    content: content,
    overview: overview,
    objectives: objectives,
    thumbnail: thumbnail || null,
    thumbnailPosition: thumbnailPosition || '50% 50%',
    cover: cover || null,
    coverPosition: coverPosition || '50% 50%',
    topic: topic ? {
      id: topic.id,
      slug: topic.slug,
      label: topic.label,
      emoji: topic.emoji,
      color: topic.color,
      parentId: topic.parentId,
    } : {
      id: 'mock',
      slug: 'mock',
      label: 'Chủ đề',
      emoji: null,
      color: '#64748b',
      parentId: null
    },
    audience: 'PUBLIC',
    badges: [],
    readTime,
    viewCount: 0,
    publishedAt: new Date(),
    updatedAt: new Date(),
    seriesId: null,
    authorId: 'preview-author',
    author: {
      id: 'preview-author',
      name: author?.name || 'Tác giả',
      image: author?.image || null,
      username: null,
    },
    tags: tags.map(t => ({ tag: { name: t, slug: t } })),
    resources: [],
    _count: { likes: 0, comments: 0, bookmarks: 0 },
    isLiked: false,
    isBookmarked: false,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950 h-full">
      
      {/* Top Bar with View Mode Toggle - Compacted */}
      <div className="flex items-center justify-end px-4 py-1.5 border-b border-zinc-300 dark:border-white/5 bg-transparent shrink-0">
        <div className="flex items-center bg-zinc-100 dark:bg-white/5 rounded-xl p-0.5 gap-0.5 shrink-0">
          {(['editor', 'split', 'preview'] as ViewMode[]).map((mode) => (
             <button type="button" key={mode} onClick={() => setViewMode(mode)}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                 viewMode === mode ? 'bg-white dark:bg-slate-700 text-zinc-800 dark:text-white shadow-sm' : 'text-zinc-500'
               }`}>
               {mode === 'editor' ? <Edit3 className="w-3 h-3" /> : mode === 'split' ? <Columns className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
               <span className="hidden sm:inline">{mode}</span>
             </button>
          ))}
        </div>
      </div>

      {/* Video Embedding Prompt */}
      {videoPromptOpen && (
        <div className="shrink-0 border-b border-zinc-300 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] px-4 py-3 flex items-center gap-2 animate-in slide-in-from-top-1 fade-in duration-150 z-20">
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
            type="button"
            className="px-3 py-1.5 text-xs font-bold bg-zinc-800 dark:bg-primary text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-40"
          >
            Chèn
          </button>
          <button type="button" onClick={() => setVideoPromptOpen(false)} className="text-zinc-500 hover:text-zinc-600 dark:hover:text-white p-1">✕</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`flex flex-col overflow-hidden ${viewMode === 'split' ? 'w-1/2 border-r border-zinc-300 dark:border-white/5' : 'flex-1'}`}>
            
            {/* Metadata Section - Resizable & Adaptive */}
            <div 
              className="shrink-0 flex flex-col overflow-y-auto bg-zinc-50/30 dark:bg-white/[0.01] divide-y divide-zinc-200 dark:divide-white/5 scrollbar-none"
              style={{ height: metadataHeight ?? 'auto' }}
            >
                <div className={`flex flex-col ${summaryOpen && metadataHeight ? 'flex-1 min-h-0' : ''}`}>
                   <button
                     type="button"
                     onClick={() => { setSummaryOpen(v => !v); setMetadataHeight(null); }}
                     className="w-full flex items-center gap-2 px-4 py-1.5 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors shrink-0"
                   >
                     <AlignLeft className="w-3 h-3 text-primary/60" />
                     <span>Tóm tắt</span>
                     {overview && !summaryOpen && (
                       <span className="ml-2 text-[10px] text-zinc-500 font-normal truncate max-w-xs lowercase italic opacity-80">({overview})</span>
                     )}
                     <ChevronDown className={`ml-auto w-3 h-3 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
                   </button>
                   {summaryOpen && (
                     <div className="px-4 pb-2 flex-1 flex flex-col min-h-0">
                       <textarea
                         value={overview}
                         onChange={e => setOverview(e.target.value)}
                         placeholder="Tóm tắt nội dung bài viết..."
                         className="flex-1 w-full text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-zinc-800 dark:text-slate-200 shadow-sm transition-all"
                       />
                     </div>
                   )}
                </div>

                <div className={`flex flex-col ${objOpen && metadataHeight ? 'flex-1 min-h-0' : ''}`}>
                   <button
                     type="button"
                     onClick={() => { setObjOpen(v => !v); setMetadataHeight(null); }}
                     className="w-full flex items-center gap-2 px-4 py-1.5 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-500 transition-colors shrink-0"
                   >
                     <Target className="w-3 h-3 text-emerald-500/60" />
                     <span>Mục tiêu</span>
                     {objectives && !objOpen && (
                       <span className="ml-2 text-[10px] text-zinc-500 font-normal truncate max-w-xs lowercase italic opacity-80">({objectives.split('\n')[0]})</span>
                     )}
                     <ChevronDown className={`ml-auto w-3 h-3 transition-transform ${objOpen ? 'rotate-180' : ''}`} />
                   </button>
                   {objOpen && (
                     <div className="px-4 pb-2 flex-1 flex flex-col min-h-0">
                       <textarea
                         value={objectives}
                         onChange={e => setObjectives(e.target.value)}
                         placeholder="- Hiểu được kiến trúc X..."
                         className="flex-1 w-full text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none text-zinc-800 dark:text-slate-200 shadow-sm transition-all"
                       />
                     </div>
                   )}
                </div>
            </div>

            {/* Resize Handle */}
            <div 
              onMouseDown={startResizing}
              className={`h-1.5 w-full cursor-row-resize bg-transparent hover:bg-primary/20 border-b border-t border-zinc-200 dark:border-white/5 transition-colors flex items-center justify-center group shrink-0 ${isResizing ? 'bg-primary/20' : ''}`}
            >
              <div className="w-8 h-0.5 bg-zinc-300 dark:bg-white/10 rounded-full group-hover:bg-primary/50 transition-colors" />
            </div>

            {/* Markdown Controls - Now below Metadata */}
            <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0c0c0c] overflow-x-auto no-scrollbar">
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
                      if (!uploadingImage) {
                        if (fileInputRef.current) fileInputRef.current.accept = 'image/*,image/gif';
                        fileInputRef.current?.click();
                      }
                    } else if (isVideoBtn) {
                      setVideoPromptOpen(v => !v);
                    } else if (action.syntax) {
                      insertSyntax(action.syntax, action.wrap);
                    }
                  };

                  return (
                    <button type="button" key={i} onClick={handleClick} disabled={isImageBtn && uploadingImage}
                      className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 ${isVideoBtn && videoPromptOpen ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'}`}>
                      {isImageBtn && uploadingImage
                         ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                         : <Icon className="w-3.5 h-3.5" />
                      }
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center px-4 py-2 bg-zinc-100 dark:bg-white/5 border-b border-zinc-200 dark:border-white/5 text-[10px] text-zinc-500 uppercase font-black tracking-widest">
              <span>Editor</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full resize-none px-8 py-6 md:px-12 md:py-10 font-medium text-sm md:text-base leading-relaxed outline-none bg-transparent text-zinc-800 dark:text-slate-200 placeholder:text-zinc-500 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/5"
              spellCheck={false}
              placeholder="Bắt đầu viết nội dung Markdown ở đây..."
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`flex-1 overflow-y-auto bg-white dark:bg-[#0c0c0c] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10 ${viewMode === 'split' ? 'w-1/2' : ''}`}>
              <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-20">
                <main className="max-w-4xl mx-auto">
                   <ArticleHero article={mockArticle} />
                   <div className="mt-12">
                      <ArticleContent
                        articleId="preview"
                        content={content}
                        overview={overview}
                        objectives={objectives}
                        likeCount={0}
                        commentCount={0}
                        isLiked={false}
                        isBookmarked={false}
                        isPreview={true}
                        audience="PUBLIC"
                      />
                   </div>
                </main>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
