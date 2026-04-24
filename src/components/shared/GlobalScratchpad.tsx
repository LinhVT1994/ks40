'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, GripHorizontal, Trash2, Bold, List, 
  Heading as HeadingIcon, Quote as QuoteIcon, 
  Check, Edit2, Plus 
} from 'lucide-react';
import { 
  type ArticleAnnotation, 
  createAnnotationAction, 
  updateAnnotationAction, 
  deleteAnnotationAction,
  getAnnotationAction 
} from '@/features/articles/actions/annotation';
import { useNotes } from '@/context/NotesContext';

export default function GlobalScratchpad() {
  const { 
    isScratchpadOpen, closeScratchpad, 
    currentArticleId, activeNoteId,
  } = useNotes();

  const [scratchpadText, setScratchpadText] = useState('');
  const [scratchpadTitle, setScratchpadTitle] = useState('');
  const [scratchpadSize, setScratchpadSize] = useState({ width: 440, height: 480 });
  const [localActiveNoteId, setLocalActiveNoteId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSavedText = useRef('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isResizing = useRef<string | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Sync with context active note if provided
  useEffect(() => {
    if (activeNoteId) {
      setLocalActiveNoteId(activeNoteId);
      loadExistingNote(activeNoteId);
    }
  }, [activeNoteId]);

  const loadExistingNote = async (id: string) => {
    try {
      const data = await getAnnotationAction(id);
      if (!data) return;

      let title = '';
      let body = data.note || '';

      // If note starts with # Title, extract it
      if (body.startsWith('# ')) {
        const lines = body.split('\n');
        title = lines[0].replace('# ', '');
        body = lines.slice(1).join('\n').trim();
      } else {
        // Fallback title from article or timestamp
        title = data.article?.title 
          ? `Ghi chú: ${data.article.title}`
          : `Ghi chú ${new Date(data.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
      }

      setScratchpadTitle(title);
      setScratchpadText(data.note || '');
      lastSavedText.current = data.note || '';
      
      if (editorRef.current) {
        editorRef.current.innerHTML = markdownToHtml(body);
      }
    } catch (err) {
      console.error('Failed to load note:', err);
    }
  };

  // Background Auto-Save
  useEffect(() => {
    if (!isScratchpadOpen) return;
    const currentText = scratchpadText.trim();
    if (currentText === lastSavedText.current) return;
    
    if (saveStatus !== 'idle') setSaveStatus('idle');
    clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(async () => {
      if (!currentText) return;
      setSaveStatus('saving');
      try {
        if (localActiveNoteId) {
          await updateAnnotationAction(localActiveNoteId, { note: currentText });
          lastSavedText.current = currentText;
          setSaveStatus('saved');
        } else {
          const saved = await createAnnotationAction({
            articleId: currentArticleId || 'global', // Use 'global' mark if no article
            selectedText: '',
            paragraphIndex: -1,
            startOffset: -1,
            endOffset: -1,
            color: 'blue',
            note: currentText,
          });
          setLocalActiveNoteId(saved.id);
          lastSavedText.current = currentText;
          setSaveStatus('saved');
        }
      } catch {
        setSaveStatus('idle');
      }
    }, 2500);

    return () => clearTimeout(typingTimeoutRef.current);
  }, [scratchpadText, isScratchpadOpen, localActiveNoteId, currentArticleId]);

  // Resizing Logic
  const startResize = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault(); e.stopPropagation();
    isResizing.current = direction;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = direction.includes('left') || direction.includes('right') ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    setScratchpadSize(prev => ({
      width: Math.max(320, Math.min(prev.width + (isResizing.current === 'left' ? -dx : dx), window.innerWidth - 40)),
      height: Math.max(200, Math.min(prev.height + (isResizing.current === 'top' ? -dy : dy), window.innerHeight - 40))
    }));
  }, []);

  const stopResize = useCallback(() => {
    isResizing.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [handleMouseMove, stopResize]);

  // Image Upload Logic for Scratchpad
  const uploadScratchpadImage = async (file: File): Promise<string> => {
    // We import compressImage dynamically or assume it's small enough to just use
    const { compressImage } = await import('@/lib/compress-image');
    const compressed = await compressImage(file, 1200, 1200);
    const ext = compressed.type === 'image/webp' ? 'webp' : 'jpg';
    const compressedFile = new File([compressed], `note-image.${ext}`, { type: compressed.type });

    const form = new FormData();
    form.append('file', compressedFile);

    // Use comment-image route as it's accessible to members
    const res = await fetch('/api/upload/comment-image', { method: 'POST', body: form });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Upload thất bại');
    }
    const { url } = await res.json();
    return url as string;
  };

  // Smart Paste Handler
  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData.items;

    // Check for images first
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setSaveStatus('saving');
          try {
            const url = await uploadScratchpadImage(file);
            const imgHtml = `<img src="${url}" alt="image" style="max-width:100%; border-radius:12px; margin: 12px 0; border: 1px solid rgba(0,0,0,0.05);" />`;
            document.execCommand('insertHTML', false, imgHtml);
            syncHtmlToMarkdown();
            setSaveStatus('saved');
          } catch (err) {
            console.error('Paste upload failed:', err);
            setSaveStatus('idle');
          }
        }
        return; // Handled image, exit
      }
    }

    // Fallback to plain text paste to avoid messy HTML styles
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    syncHtmlToMarkdown();
  };

  // Markdown Bridge
  const htmlToMarkdown = (html: string) => {
    return html
      .replace(/<img.*?src=["'](.*?)["'].*?>/g, '![]($1)')
      .replace(/<div><br><\/div>/g, '\n').replace(/<div>/g, '\n').replace(/<\/div>/g, '')
      .replace(/<br>/g, '\n').replace(/<b>(.*?)<\/b>/g, '**$1**').replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<i>(.*?)<\/i>/g, '*$1*').replace(/<em>(.*?)<\/em>/g, '*$1*').replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
      .replace(/&nbsp;/g, ' ').replace(/\n\n+/g, '\n\n').trim();
  };

  const syncHtmlToMarkdown = () => {
    if (!editorRef.current) return;
    const bodyMd = htmlToMarkdown(editorRef.current.innerHTML);
    const title = scratchpadTitle.trim() || 'Ghi chú mới';
    setScratchpadText(`# ${title}\n\n${bodyMd}`);
  };

  const markdownToHtml = (md: string) => {
    return md
      .replace(/!\[\]\((.*?)\)/g, '<img src="$1" style="max-width:100%; border-radius:12px; margin: 12px 0; border: 1px solid rgba(0,0,0,0.05);" />')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/### (.*?)\n/g, '<h3>$1</h3>')
      .replace(/> (.*?)\n/g, '<blockquote>$1</blockquote>').replace(/\n/g, '<br>');
  };

  // Commands
  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    syncHtmlToMarkdown();
  };

  // Keyboard Fixes
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      const target = selection.anchorNode?.parentElement;
      const block = target?.closest('h3, blockquote');
      if (block?.tagName === 'H3') {
        e.preventDefault(); document.execCommand('insertHTML', false, '<div><br></div>');
        setTimeout(syncHtmlToMarkdown, 0);
      }
    }
  };

  // Init
  useEffect(() => {
    if (isScratchpadOpen && editorRef.current) {
      document.execCommand('defaultParagraphSeparator', false, 'div');
      if (!scratchpadTitle && !scratchpadText) {
        const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        setScratchpadTitle(`Ghi chú ${timeStr}`);
      }
    }
  }, [isScratchpadOpen]);

  const handleDelete = async () => {
    if (!localActiveNoteId || !confirm('Xóa ghi chú này?')) return;
    try {
      await deleteAnnotationAction(localActiveNoteId);
      setScratchpadText(''); setScratchpadTitle(''); setLocalActiveNoteId(null);
      openScratchpad(null); // Reset global context
      closeScratchpad();
    } catch {}
  };

  return (
    <AnimatePresence>
      {isScratchpadOpen && (
        <motion.div
           initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
           drag={!isResizing.current} dragMomentum={false} onMouseDown={e => e.stopPropagation()}
           style={{ width: scratchpadSize.width, height: scratchpadSize.height }}
           className="fixed bottom-12 right-12 z-[9995] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden flex flex-col"
        >
          {/* Edge Resize Handles */}
          <div className="absolute top-0 left-0 right-0 h-1 cursor-row-resize z-50" onMouseDown={e => startResize(e, 'top')} />
          <div className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize z-50" onMouseDown={e => startResize(e, 'bottom')} />
          <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50" onMouseDown={e => startResize(e, 'left')} />
          <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50" onMouseDown={e => startResize(e, 'right')} />

          {/* Header */}
          <div className="h-12 bg-zinc-50 dark:bg-slate-900 border-b border-zinc-100 dark:border-white/5 flex items-center gap-3 px-4 cursor-grab active:cursor-grabbing shrink-0">
             <GripHorizontal className="w-3.5 h-3.5 text-zinc-400" />
             <input
                type="text" value={scratchpadTitle}
                onChange={e => { setScratchpadTitle(e.target.value); syncHtmlToMarkdown(); }}
                className="flex-1 bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400"
             />
             <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => { 
                    setScratchpadTitle(''); 
                    setScratchpadText(''); 
                    setLocalActiveNoteId(null); 
                    openScratchpad(null);
                    if (editorRef.current) editorRef.current.innerHTML = ''; 
                    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    setScratchpadTitle(`Ghi chú ${timeStr}`);
                  }} 
                  className="p-1.5 hover:bg-primary/10 rounded-lg text-zinc-400 hover:text-primary"
                  title="Ghi chú mới"
                >
                  <Plus className="w-4 h-4" />
                </button>
               {localActiveNoteId && <button onClick={handleDelete} className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
               <button onClick={closeScratchpad} className="p-1.5 hover:bg-black/10 rounded-lg text-zinc-400"><X className="w-4 h-4" /></button>
             </div>
          </div>

          <div className="flex items-center gap-0.5 px-3 py-1.5 bg-zinc-50/30 dark:bg-white/2 border-b border-zinc-100 dark:border-white/5 shrink-0 overflow-x-auto no-scrollbar">
            <button onClick={() => handleCommand('bold')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-500"><Bold className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleCommand('formatBlock', '<h3>')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-500"><HeadingIcon className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleCommand('formatBlock', '<blockquote>')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-500"><QuoteIcon className="w-3.5 h-3.5" /></button>
          </div>

          <div className="flex-1 relative bg-[#fdfdfc] dark:bg-slate-900/50 overflow-hidden" onMouseDown={e => e.stopPropagation()}>
            <div
              ref={editorRef} contentEditable suppressContentEditableWarning onInput={syncHtmlToMarkdown} onKeyDown={handleEditorKeyDown} onPaste={handlePaste}
              className="w-full h-full p-6 pt-4 outline-none leading-relaxed text-[15px] text-zinc-800 dark:text-zinc-100 overflow-y-auto custom-scrollbar prose prose-sm prose-zinc dark:prose-invert max-w-none"
            />
            <div className="absolute bottom-4 right-5 pointer-events-none">
              <AnimatePresence>
                {saveStatus !== 'idle' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-bold px-2 py-1 rounded-full border bg-white/50 backdrop-blur-sm shadow-sm">
                    {saveStatus === 'saving' ? 'Đang lưu...' : '✓ Đã lưu'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
