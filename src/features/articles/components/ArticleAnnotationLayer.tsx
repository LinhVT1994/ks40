'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { StickyNote } from 'lucide-react';
import TextSelectionToolbar from '@/features/member/components/notes/TextSelectionToolbar';
import InlineNoteEditor from '@/features/member/components/notes/InlineNoteEditor';
import NotePopover from '@/features/member/components/notes/NotePopover';
import {
  createAnnotationAction,
  deleteAnnotationAction,
  updateAnnotationAction,
  type ArticleAnnotation,
} from '@/features/articles/actions/annotation';
import { useNotes } from '@/context/NotesContext';

interface Props {
  articleId: string;
  initialAnnotations: ArticleAnnotation[];
  children: React.ReactNode;
  onAnnotationsChange?: (annotations: ArticleAnnotation[]) => void;
}

const CONTENT_SELECTOR = '[data-article-content]';

// Color name <-> hex maps (hex values come from TextSelectionToolbar)
const HEX_TO_NAME: Record<string, string> = {
  '#fef08a': 'yellow',
  '#bbf7d0': 'green',
  '#bfdbfe': 'blue',
  '#fbcfe8': 'pink',
};
const NAME_TO_HEX: Record<string, string> = {
  yellow: '#fef08a',
  green:  '#bbf7d0',
  blue:   '#bfdbfe',
  pink:   '#fbcfe8',
};

function colorToHex(color: string): string {
  // Accept both hex (from toolbar) and name (from DB)
  if (color.startsWith('#')) return color;
  return NAME_TO_HEX[color] ?? NAME_TO_HEX.yellow;
}
function colorToName(color: string): string {
  if (color.startsWith('#')) return HEX_TO_NAME[color] ?? 'yellow';
  return color;
}

function getLeafBlocks(parent: Element): Element[] {
  // Tags that group blocks but shouldn't be treated as a single massive block
  const PASS_THROUGH_TAGS = new Set(['UL', 'OL', 'TABLE', 'TBODY', 'THEAD', 'TR']);
  
  const blocks: Element[] = [];
  for (const child of Array.from(parent.children)) {
    if (PASS_THROUGH_TAGS.has(child.tagName)) {
      blocks.push(...getLeafBlocks(child));
    } else {
      if (child.textContent?.trim()) {
        blocks.push(child);
      }
    }
  }
  return blocks;
}

function getBlockElements(container: Element): Element[] {
  // Find all `.prose` scope containers (Overview, Objectives, Main Content)
  const proseScopes = Array.from(container.querySelectorAll('.prose'));
  if (proseScopes.length === 0) {
    proseScopes.push(container);
  }
  
  return proseScopes.flatMap(scope => getLeafBlocks(scope));
}

function captureSelectionPosition(
  range: Range,
  container: Element,
): { paragraphIndex: number; startOffset: number; endOffset: number } | null {
  const blocks = getBlockElements(container);

  // Find the exact block that intersects with the user's selection
  let paragraphIndex = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (range.intersectsNode(blocks[i])) {
      paragraphIndex = i;
      break;
    }
  }

  if (paragraphIndex === -1) return null;
  const block = blocks[paragraphIndex];

  // Calculate startOffset using TreeWalker directly on the block's text nodes
  const tw = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  let startOffset = -1;
  
  let textNode: Node | null;
  while ((textNode = tw.nextNode())) {
    if (range.intersectsNode(textNode)) {
      const localOffset = textNode === range.startContainer ? range.startOffset : 0;
      startOffset = charCount + localOffset;
      break;
    }
    charCount += (textNode as Text).length;
  }

  if (startOffset === -1) startOffset = 0;

  const endOffset = startOffset + range.toString().length;
  return { paragraphIndex, startOffset, endOffset };
}


function wrapRangeWithMarks(
  range: Range,
  annotation: { id: string; color: string; note?: string | null },
): HTMLElement[] {
  const marks: HTMLElement[] = [];
  const textNodes: Text[] = [];

  const tw = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
  let textNode: Node | null;
  while ((textNode = tw.nextNode())) {
    if (range.intersectsNode(textNode)) {
      textNodes.push(textNode as Text);
    }
  }

  // Fallback for single exact text node selections
  if (textNodes.length === 0 && range.startContainer.nodeType === Node.TEXT_NODE) {
    textNodes.push(range.startContainer as Text);
  }

  for (const t of textNodes) {
    const isStart = t === range.startContainer;
    const isEnd = t === range.endContainer;

    const startOffset = isStart ? range.startOffset : 0;
    const endOffset = isEnd ? range.endOffset : t.length;

    if (startOffset === endOffset && startOffset !== 0) continue;

    const markRange = document.createRange();
    try {
      markRange.setStart(t, startOffset);
      markRange.setEnd(t, endOffset);

      const mark = createMarkElement(annotation as ArticleAnnotation);
      markRange.surroundContents(mark);
      marks.push(mark);
    } catch {
      continue;
    }
  }

  return marks;
}

function applyHighlightToDOM(
  annotation: ArticleAnnotation | { id: string; paragraphIndex: number; startOffset: number; endOffset: number; color: string; note?: string | null },
  container: Element,
) {
  if (annotation.paragraphIndex === -1) return; // Skip general notes

  const blocks = getBlockElements(container);
  const block = blocks[annotation.paragraphIndex];
  if (!block) return;

  const tw = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  let startNode: Text | null = null, endNode: Text | null = null;
  let startNodeOffset = 0, endNodeOffset = 0;

  let textNode: Node | null;
  while ((textNode = tw.nextNode())) {
    const t = textNode as Text;
    const len = t.length;
    if (!startNode && charCount + len > annotation.startOffset) {
      startNode = t;
      startNodeOffset = annotation.startOffset - charCount;
    }
    if (startNode && charCount + len >= annotation.endOffset) {
      endNode = t;
      endNodeOffset = annotation.endOffset - charCount;
      break;
    }
    charCount += len;
  }
  if (!startNode || !endNode) return;

  try {
    const range = document.createRange();
    range.setStart(startNode, startNodeOffset);
    range.setEnd(endNode, endNodeOffset);

    const marks = wrapRangeWithMarks(range, annotation as any);

    // Append delete button to the last mark segment
    if (!annotation.note && marks.length > 0) {
      const lastMark = marks[marks.length - 1];
      const deleteBtn = lastMark.querySelector('.ks-highlight-delete') as HTMLElement | null;
      if (!deleteBtn) {
        const btn = buildDeleteBtn();
        lastMark.appendChild(btn);
      }
    }
  } catch {
    // ignore
  }
}

function createMarkElement(
  annotation: ArticleAnnotation,
): HTMLElement {
  const mark = document.createElement('mark');
  mark.className = `ks-highlight${annotation.note ? ' ks-highlight-note' : ''}`;
  mark.dataset.color = annotation.color || 'yellow';
  mark.dataset.annotationId = annotation.id;
  if (annotation.note) mark.dataset.note = annotation.note;
  return mark;
}

function buildDeleteBtn() {
  const btn = document.createElement('span');
  btn.className = 'ks-highlight-delete';
  btn.innerHTML = '×';
  return btn;
}

function removeMarkFromDOM(markEl: HTMLElement) {
  const parent = markEl.parentNode;
  if (!parent) return;
  while (markEl.firstChild) {
    const child = markEl.firstChild as HTMLElement;
    if (child.classList?.contains('ks-highlight-delete')) {
      markEl.removeChild(child);
    } else {
      parent.insertBefore(child, markEl);
    }
  }
  parent.removeChild(markEl);
}

function captureSelectionFromElement(
  el: HTMLElement,
  container: Element,
): { paragraphIndex: number; startOffset: number; endOffset: number } | null {
  const blocks = getBlockElements(container);
  let paragraphIndex = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].contains(el)) {
      paragraphIndex = i;
      break;
    }
  }
  if (paragraphIndex === -1) return null;

  const block = blocks[paragraphIndex];
  const tw = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  let node: Node | null;
  while ((node = tw.nextNode())) {
    if (el.contains(node)) break;
    charCount += (node as Text).length;
  }
  const startOffset = charCount;
  const endOffset = startOffset + (el.textContent?.length ?? 0);
  return { paragraphIndex, startOffset, endOffset };
}

export default function ArticleAnnotationLayer({
  articleId,
  initialAnnotations,
  children,
  onAnnotationsChange,
}: Props) {
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<ArticleAnnotation[]>(initialAnnotations);
  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    range: Range;
    rect: DOMRect;
  } | null>(null);
  const [activePopover, setActivePopover] = useState<{
    annotationId: string;
    rect: DOMRect;
  } | null>(null);
  const [isEditingExistingNote, setIsEditingExistingNote] = useState(false);
  const [hoveredNote, setHoveredNote] = useState<{
    id: string;
    rect: DOMRect;
    content: string;
  } | null>(null);
  const { scrollToNoteId, setScrollToNoteId, openSidebar } = useNotes();
  const searchParams = useSearchParams();

  // Handle direct navigation via URL ?noteId=xxx
  useEffect(() => {
    const noteId = searchParams?.get('noteId');
    if (noteId) {
      setScrollToNoteId(noteId);
      // Clean up URL to prevent re-scroll on refresh if desired, 
      // but usually keeping it is fine for sharing.
    }
  }, [searchParams, setScrollToNoteId]);

  // Scroll to note handler
  useEffect(() => {
    if (!scrollToNoteId) return;
    
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (!container) return;

    const targetEl = container.querySelector(`[data-annotation-id="${scrollToNoteId}"]`) as HTMLElement | null;
    
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Visual feedback: pulse/flash effect
      targetEl.classList.add('ks-highlight-pulse');
      setTimeout(() => {
        targetEl.classList.remove('ks-highlight-pulse');
        setScrollToNoteId(null);
      }, 2000);
    } else {
      setScrollToNoteId(null);
    }
  }, [scrollToNoteId, setScrollToNoteId]);

  useEffect(() => {
    onAnnotationsChange?.(annotations);
  }, [annotations, onAnnotationsChange]);

  const handleDeleteFromDOM = useCallback(async (id: string, _markEl: HTMLElement) => {
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (container) {
      const segments = Array.from(container.querySelectorAll(`mark.ks-highlight[data-annotation-id="${id}"]`));
      segments.forEach(el => removeMarkFromDOM(el as HTMLElement));
    }
    
    setAnnotations(prev => prev.filter(a => a.id !== id));
    try { await deleteAnnotationAction(id); } catch {}
  }, []);

  const handleNoteClickFromDOM = useCallback((id: string, rect: DOMRect) => {
    setActivePopover({ annotationId: id, rect });
    setIsEditingExistingNote(false);
  }, []);

  // Re-apply saved annotations to DOM dynamically to survive React reconciliation
  useEffect(() => {
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (!container) return;

    // We compare what's currently in the DOM with the 'annotations' state
    const existingMarks = new Set(
      Array.from(container.querySelectorAll('mark.ks-highlight[data-annotation-id]'))
        .map(el => (el as HTMLElement).dataset.annotationId)
        .filter(Boolean)
    );

    // Apply missing annotations
    for (const ann of annotations) {
      if (!existingMarks.has(ann.id)) {
        applyHighlightToDOM(ann, container);
      }
    }
  }, [annotations]);

  // Unified Interaction Handler (Event Delegation)
  useEffect(() => {
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest('.ks-highlight') as HTMLElement | null;
      if (!mark) return;
      
      const id = mark.dataset.annotationId;
      if (!id) return;

      const ann = annotations.find(a => a.id === id);
      if (!ann) return;

      e.stopPropagation();

      if (target.closest('.ks-highlight-delete')) {
        handleDeleteFromDOM(id, mark);
        return;
      }

      if (ann.note) {
        handleNoteClickFromDOM(id, mark.getBoundingClientRect());
      } else {
        openSidebar();
        setScrollToNoteId(id);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest('.ks-highlight') as HTMLElement | null;
      if (!mark) return;
      
      const id = mark.dataset.annotationId;
      const note = mark.dataset.note;
      if (id && note) {
        setHoveredNote({ id, content: note, rect: mark.getBoundingClientRect() });
      }
    };

    const handleMouseOut = () => {
      setHoveredNote(null);
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);

    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
    };
  }, [annotations, openSidebar, setScrollToNoteId, handleNoteClickFromDOM, handleDeleteFromDOM]);

  const handleHighlight = useCallback(async (text: string, range: Range, colorHex: string) => {
    import('sonner').then(({ toast }) => {
      if (!session?.user?.id) {
        toast.error('Vui lòng đăng nhập để highlight');
        return;
      }
      const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
      if (!container) {
        toast.error('Không tìm thấy vùng lưu trữ bài viết');
        return;
      }

      const pos = captureSelectionPosition(range, container);
      if (!pos) {
        toast.error('Không thể xác định vị trí đoạn trích. Hãy thử bôi đen gọn trong một đoạn văn.');
        return;
      }

      const colorName = colorToName(colorHex);

      // Optimistic DOM update using safe wrapper
      const marks = wrapRangeWithMarks(
        range,
        { id: 'pending', color: colorName },
      );
      if (marks.length === 0) return;
      const primaryMark = marks[marks.length - 1];

      const deleteBtn = buildDeleteBtn('pending', primaryMark, (_id, el) => removeMarkFromDOM(el));
      primaryMark.appendChild(deleteBtn);
      window.getSelection()?.removeAllRanges();

      createAnnotationAction({
        articleId,
        selectedText: text.trim(),
        ...pos,
        color: colorName,
      }).then(saved => {
        // Update all generated mark segments with actual ID
        marks.forEach(m => {
          m.dataset.annotationId = saved.id;
        });
        deleteBtn.onclick = (e) => { e.stopPropagation(); handleDeleteFromDOM(saved.id, primaryMark); };
        setAnnotations(prev => [...prev, saved]);
        toast.success('Đã lưu highlight');
      }).catch(err => {
        marks.forEach(m => removeMarkFromDOM(m));
        toast.error('Lưu thất bại: ' + (err.message || 'Lỗi kết nối'));
      });
    });
  }, [session, articleId, handleDeleteFromDOM]);

  const handleAddNote = useCallback((text: string, range: Range) => {
    const rect = range.getBoundingClientRect();
    const marks = wrapRangeWithMarks(
      range,
      { id: 'pending-note', color: 'yellow' },
    );
    window.getSelection()?.removeAllRanges();
    setPendingSelection({ text, range, rect });
  }, []);

  const handleSaveNote = useCallback(async (noteContent: string) => {
    if (!pendingSelection || !session?.user?.id) return;
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (!container) return;

    // We take pos from the first temporary mark segment
    const allTempMarks = Array.from(container.querySelectorAll('.ks-highlight[data-annotation-id="pending-note"]'));
    const tempMark = allTempMarks[0] as HTMLElement | undefined;
    const pos = tempMark ? captureSelectionFromElement(tempMark, container) : null;
    if (!pos) { setPendingSelection(null); return; }

    try {
      const saved = await createAnnotationAction({
        articleId,
        selectedText: pendingSelection.text.trim(),
        ...pos,
        color: 'yellow',
        note: noteContent,
      });
      allTempMarks.forEach(m => {
        const el = m as HTMLElement;
        el.className = 'ks-highlight ks-highlight-note';
        el.dataset.color = 'yellow';
        el.dataset.annotationId = saved.id;
        el.dataset.note = noteContent;
        el.onclick = (e) => {
          e.stopPropagation();
          handleNoteClickFromDOM(saved.id, el.getBoundingClientRect());
        };
      });
      setAnnotations(prev => [...prev, saved]);
      import('sonner').then(({ toast }) => toast.success('Đã lưu ghi chú'));
    } catch {
      allTempMarks.forEach(m => removeMarkFromDOM(m as HTMLElement));
      import('sonner').then(({ toast }) => toast.error('Lưu ghi chú thất bại'));
    }
    setPendingSelection(null);
  }, [pendingSelection, session, articleId, handleNoteClickFromDOM]);

  const handleCancelNote = useCallback(() => {
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (container) {
      const allTempMarks = Array.from(container.querySelectorAll('.ks-highlight[data-annotation-id="pending-note"]'));
      allTempMarks.forEach(m => removeMarkFromDOM(m as HTMLElement));
    }
    setPendingSelection(null);
  }, []);

  const handleRemoveHighlight = useCallback(async (range: Range) => {
    const el = range.startContainer.parentElement?.closest('[data-annotation-id]') as HTMLElement | null;
    if (!el) return;
    const id = el.dataset.annotationId!;
    removeMarkFromDOM(el);
    setAnnotations(prev => prev.filter(a => a.id !== id));
    try { await deleteAnnotationAction(id); } catch {}
  }, []);

  const handleUpdateNote = useCallback(async (id: string, note: string) => {
    try {
      const updated = await updateAnnotationAction(id, { note });
      setAnnotations(prev => prev.map(a => a.id === id ? updated : a));
      const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
      if (container) {
        const mark = container.querySelector(`[data-annotation-id="${id}"]`) as HTMLElement | null;
        if (mark) mark.dataset.note = note;
      }
    } catch {}
    setActivePopover(null);
    setIsEditingExistingNote(false);
  }, []);

  const activeAnnotation = activePopover
    ? annotations.find(a => a.id === activePopover.annotationId)
    : null;

  return (
    <div ref={containerRef} className="relative">
      {session && (
        <TextSelectionToolbar
          onHighlight={handleHighlight}
          onAddNote={handleAddNote}
          onRemoveHighlight={handleRemoveHighlight}
        />
      )}

      {children}

      <AnimatePresence>
        {pendingSelection && (
          <InlineNoteEditor
            selection={pendingSelection}
            onSave={handleSaveNote}
            onCancel={handleCancelNote}
          />
        )}
      </AnimatePresence>



      <AnimatePresence>
        {activePopover && activeAnnotation?.note && (
          isEditingExistingNote ? (
            <InlineNoteEditor
              key="edit-existing-note"
              selection={{ rect: activePopover.rect }}
              initialValue={activeAnnotation.note}
              onSave={(newNote) => handleUpdateNote(activeAnnotation.id, newNote)}
              onCancel={() => setIsEditingExistingNote(false)}
            />
          ) : (
            <NotePopover
              key="view-existing-note"
              rect={activePopover.rect}
              content={activeAnnotation.note}
              onClose={() => setActivePopover(null)}
              onEdit={() => setIsEditingExistingNote(true)}
              onDelete={() => {
                const container = containerRef.current?.querySelector('.article-content') ?? containerRef.current;
                const domEl = container?.querySelector(`[data-annotation-id="${activeAnnotation.id}"]`) as HTMLElement;
                if (domEl) {
                  handleDeleteFromDOM(activeAnnotation.id, domEl);
                } else {
                  // Fallback if not found in DOM
                  handleDeleteFromDOM(activeAnnotation.id, document.createElement('div'));
                }
                setActivePopover(null);
              }}
            />
          )
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hoveredNote && !activePopover && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed z-[60] pointer-events-none"
            style={{
              left: hoveredNote.rect.left + hoveredNote.rect.width / 2,
              top: hoveredNote.rect.top - 14,
              transform: 'translateX(-50%) translateY(-100%)',
            }}
          >
            <div className="relative group">
              <div className="relative bg-white dark:bg-[#0f172a] px-4 py-3 rounded-xl shadow-lg border border-zinc-200 dark:border-white/10 max-w-[260px]">
                <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200 font-medium line-clamp-5">
                  {hoveredNote.content}
                </p>
                
                <div className="mt-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.15em] text-blue-500/80">
                  <div className="w-1 h-1 rounded-full bg-current" />
                  <span>Ghi chú</span>
                </div>
              </div>
              
              {/* Simple Arrow */}
              <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-white dark:bg-[#0f172a] rotate-45 border-r border-b border-zinc-200 dark:border-white/10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
