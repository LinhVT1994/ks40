'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import TextSelectionToolbar from '@/features/member/components/notes/TextSelectionToolbar';
import InlineNoteEditor from '@/features/member/components/notes/InlineNoteEditor';
import NotePopover from '@/features/member/components/notes/NotePopover';
import HighlightActionToolbar from '@/features/member/components/notes/HighlightActionToolbar';
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
  authorAnnotations?: ArticleAnnotation[];
  isAuthor?: boolean;
  children: React.ReactNode;
  onAnnotationsChange?: (annotations: ArticleAnnotation[]) => void;
}

const CONTENT_SELECTOR = '[data-article-content]';

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
  if (color.startsWith('#')) return color;
  return NAME_TO_HEX[color] ?? NAME_TO_HEX.yellow;
}
function colorToName(color: string): string {
  if (color.startsWith('#')) return HEX_TO_NAME[color] ?? 'yellow';
  return color;
}

function getLeafBlocks(parent: Element): Element[] {
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
  let paragraphIndex = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (range.intersectsNode(blocks[i])) {
      paragraphIndex = i;
      break;
    }
  }
  if (paragraphIndex === -1) return null;
  const block = blocks[paragraphIndex];

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

function createMarkElement(
  annotation: { id: string; color: string; note?: string | null },
  isAuthorMark = false,
): HTMLElement {
  const mark = document.createElement('mark');
  if (isAuthorMark) {
    mark.className = `ks-author-highlight${annotation.note ? ' ks-author-note' : ''}`;
    mark.dataset.isAuthor = 'true';
  } else {
    mark.className = `ks-highlight${annotation.note ? ' ks-highlight-note' : ''}`;
  }
  mark.dataset.color = annotation.color || 'yellow';
  mark.dataset.annotationId = annotation.id;
  if (annotation.note) mark.dataset.note = annotation.note;
  return mark;
}

function wrapRangeWithMarks(
  range: Range,
  annotation: { id: string; color: string; note?: string | null },
  isAuthorMark = false,
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
      const mark = createMarkElement(annotation, isAuthorMark);
      markRange.surroundContents(mark);
      marks.push(mark);
    } catch {
      continue;
    }
  }
  return marks;
}

function applyHighlightToDOM(
  annotation: { id: string; paragraphIndex: number; startOffset: number; endOffset: number; color: string; note?: string | null },
  container: Element,
  isAuthorMark = false,
) {
  if (annotation.paragraphIndex === -1) return;

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
    wrapRangeWithMarks(range, annotation, isAuthorMark);
  } catch {
    // ignore
  }
}

function removeMarkFromDOM(markEl: HTMLElement) {
  const parent = markEl.parentNode;
  if (!parent) return;
  while (markEl.firstChild) {
    parent.insertBefore(markEl.firstChild, markEl);
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
  authorAnnotations: initialAuthorAnnotations = [],
  isAuthor = false,
  children,
  onAnnotationsChange,
}: Props) {
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  // Never mix public annotations into personal state — they are rendered separately
  const [annotations, setAnnotations] = useState<ArticleAnnotation[]>(
    initialAnnotations.filter(a => !a.isPublic)
  );
  const [publicAnnotations, setPublicAnnotations] = useState<ArticleAnnotation[]>(initialAuthorAnnotations);
  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    range: Range;
    rect: DOMRect;
  } | null>(null);
  const [pendingPublicSelection, setPendingPublicSelection] = useState<{
    text: string;
    range: Range;
    rect: DOMRect;
  } | null>(null);
  const [activePopover, setActivePopover] = useState<{
    annotationId: string;
    rect: DOMRect;
    isAuthorNote?: boolean;
  } | null>(null);
  const [isEditingExistingNote, setIsEditingExistingNote] = useState(false);
  const [hoveredNote, setHoveredNote] = useState<{
    id: string;
    rect: DOMRect;
    content: string;
    isAuthorNote?: boolean;
  } | null>(null);
  const [hoveredHighlight, setHoveredHighlight] = useState<{
    element: HTMLElement;
    rect: DOMRect;
    id: string;
    isAuthorMark?: boolean;
  } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);
  const { scrollToNoteId, setScrollToNoteId, openSidebar } = useNotes();
  const searchParams = useSearchParams();

  useEffect(() => {
    const noteId = searchParams?.get('noteId');
    if (noteId) {
      setScrollToNoteId(noteId);
    }
  }, [searchParams, setScrollToNoteId]);

  useEffect(() => {
    if (!scrollToNoteId) return;
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (!container) return;

    const targetEl = container.querySelector(`[data-annotation-id="${scrollToNoteId}"]`) as HTMLElement | null;
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      const segments = Array.from(container.querySelectorAll(`mark[data-annotation-id="${id}"]`));
      segments.forEach(el => removeMarkFromDOM(el as HTMLElement));
    }
    setAnnotations(prev => prev.filter(a => a.id !== id));
    setPublicAnnotations(prev => prev.filter(a => a.id !== id));
    try { await deleteAnnotationAction(id); } catch {}
  }, []);

  const handleNoteClickFromDOM = useCallback((id: string, rect: DOMRect, isAuthorNote = false) => {
    setActivePopover({ annotationId: id, rect, isAuthorNote });
    setIsEditingExistingNote(false);
  }, []);

  // Re-apply saved annotations to DOM (both personal and author public)
  useEffect(() => {
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (!container) return;

    const existingIds = new Set(
      Array.from(container.querySelectorAll('mark[data-annotation-id]'))
        .map(el => (el as HTMLElement).dataset.annotationId)
        .filter(Boolean)
    );

    for (const ann of annotations) {
      if (!existingIds.has(ann.id)) {
        applyHighlightToDOM(ann, container, false);
      }
    }

    for (const ann of publicAnnotations) {
      if (!existingIds.has(ann.id)) {
        applyHighlightToDOM(ann, container, true);
      }
    }
  }, [annotations, publicAnnotations]);

  // Unified Interaction Handler (Event Delegation)
  useEffect(() => {
    const rawContainer = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (!rawContainer) return;
    const container = rawContainer as HTMLElement;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest('.ks-highlight, .ks-author-highlight') as HTMLElement | null;
      if (!mark) return;

      const id = mark.dataset.annotationId;
      if (!id) return;

      const isAuthorMark = mark.dataset.isAuthor === 'true';
      const ann = isAuthorMark
        ? publicAnnotations.find(a => a.id === id)
        : annotations.find(a => a.id === id);
      if (!ann) return;

      e.stopPropagation();

      if (target.closest('.ks-highlight-delete')) {
        if (!isAuthorMark) handleDeleteFromDOM(id, mark);
        return;
      }

      if (ann.note) {
        handleNoteClickFromDOM(id, mark.getBoundingClientRect(), isAuthorMark);
      } else if (!isAuthorMark) {
        openSidebar();
        setScrollToNoteId(id);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest('.ks-highlight, .ks-author-highlight') as HTMLElement | null;
      const toolbar = target.closest('[data-highlight-toolbar]');

      if (mark || toolbar) {
        isHoveringRef.current = true;
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        if (mark) {
          const id = mark.dataset.annotationId;
          const note = mark.dataset.note;
          const isAuthorMark = mark.dataset.isAuthor === 'true';
          if (id) {
            if (note) {
              setHoveredNote({ id, content: note, rect: mark.getBoundingClientRect(), isAuthorNote: isAuthorMark });
            } else if (!isAuthorMark) {
              setHoveredHighlight({ element: mark, rect: mark.getBoundingClientRect(), id });
            } else if (isAuthorMark && isAuthor) {
              // Author can see delete option on their own public highlights
              setHoveredHighlight({ element: mark, rect: mark.getBoundingClientRect(), id, isAuthorMark: true });
            }
          }
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement;
      if (
        related?.closest('.ks-highlight') ||
        related?.closest('.ks-author-highlight') ||
        related?.closest('[data-highlight-toolbar]')
      ) {
        return;
      }
      isHoveringRef.current = false;
      setHoveredNote(null);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isHoveringRef.current) {
          setHoveredHighlight(null);
        }
      }, 400);
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);

    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [annotations, publicAnnotations, openSidebar, setScrollToNoteId, handleNoteClickFromDOM, handleDeleteFromDOM]);

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
      const marks = wrapRangeWithMarks(range, { id: 'pending', color: colorName });
      if (marks.length === 0) return;

      window.getSelection()?.removeAllRanges();

      createAnnotationAction({
        articleId,
        selectedText: text.trim(),
        ...pos,
        color: colorName,
      }).then(saved => {
        marks.forEach(m => { m.dataset.annotationId = saved.id; });
        setAnnotations(prev => [...prev, saved]);
        toast.success('Đã lưu highlight');
      }).catch(err => {
        marks.forEach(m => removeMarkFromDOM(m));
        toast.error('Lưu thất bại: ' + (err.message || 'Lỗi kết nối'));
      });
    });
  }, [session, articleId]);

  const handleAddNote = useCallback((text: string, range: Range) => {
    const rect = range.getBoundingClientRect();
    wrapRangeWithMarks(range, { id: 'pending-note', color: 'yellow' });
    window.getSelection()?.removeAllRanges();
    setPendingSelection({ text, range, rect });
  }, []);

  const handlePublicHighlight = useCallback(async (text: string, range: Range) => {
    import('sonner').then(({ toast }) => {
      if (!session?.user?.id) return;
      const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
      if (!container) return;

      const pos = captureSelectionPosition(range, container as Element);
      if (!pos) {
        toast.error('Không thể xác định vị trí. Hãy thử bôi đen gọn trong một đoạn văn.');
        return;
      }

      const marks = wrapRangeWithMarks(range, { id: 'pending-public', color: 'yellow' }, true);
      if (marks.length === 0) return;
      window.getSelection()?.removeAllRanges();

      createAnnotationAction({
        articleId,
        selectedText: text.trim(),
        ...pos,
        color: 'yellow',
        isPublic: true,
      }).then(saved => {
        marks.forEach(m => { m.dataset.annotationId = saved.id; });
        setPublicAnnotations(prev => [...prev, saved]);
        toast.success('Đã lưu highlight công khai');
      }).catch(err => {
        marks.forEach(m => removeMarkFromDOM(m));
        toast.error('Lưu thất bại: ' + (err.message || 'Lỗi kết nối'));
      });
    });
  }, [session, articleId]);

  const handleAddPublicNote = useCallback((text: string, range: Range) => {
    const rect = range.getBoundingClientRect();
    wrapRangeWithMarks(range, { id: 'pending-public-note', color: 'yellow' }, true);
    window.getSelection()?.removeAllRanges();
    setPendingPublicSelection({ text, range, rect });
  }, []);

  const handleSaveNote = useCallback(async (noteContent: string) => {
    if (!pendingSelection || !session?.user?.id) return;
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (!container) return;

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

  const handleSavePublicNote = useCallback(async (noteContent: string) => {
    if (!pendingPublicSelection || !session?.user?.id) return;
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (!container) return;

    const allTempMarks = Array.from(container.querySelectorAll('.ks-author-highlight[data-annotation-id="pending-public-note"]'));
    const tempMark = allTempMarks[0] as HTMLElement | undefined;
    const pos = tempMark ? captureSelectionFromElement(tempMark, container) : null;
    if (!pos) { setPendingPublicSelection(null); return; }

    try {
      const saved = await createAnnotationAction({
        articleId,
        selectedText: pendingPublicSelection.text.trim(),
        ...pos,
        color: 'yellow',
        note: noteContent,
        isPublic: true,
      });
      allTempMarks.forEach(m => {
        const el = m as HTMLElement;
        el.className = 'ks-author-highlight ks-author-note';
        el.dataset.color = 'yellow';
        el.dataset.annotationId = saved.id;
        el.dataset.note = noteContent;
        el.dataset.isAuthor = 'true';
      });
      setPublicAnnotations(prev => [...prev, saved]);
      import('sonner').then(({ toast }) => toast.success('Đã lưu ghi chú công khai'));
    } catch {
      allTempMarks.forEach(m => removeMarkFromDOM(m as HTMLElement));
      import('sonner').then(({ toast }) => toast.error('Lưu ghi chú thất bại'));
    }
    setPendingPublicSelection(null);
  }, [pendingPublicSelection, session, articleId]);

  const handleCancelNote = useCallback(() => {
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (container) {
      const allTempMarks = Array.from(container.querySelectorAll('.ks-highlight[data-annotation-id="pending-note"]'));
      allTempMarks.forEach(m => removeMarkFromDOM(m as HTMLElement));
    }
    setPendingSelection(null);
  }, []);

  const handleCancelPublicNote = useCallback(() => {
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (container) {
      const allTempMarks = Array.from(container.querySelectorAll('.ks-author-highlight[data-annotation-id="pending-public-note"]'));
      allTempMarks.forEach(m => removeMarkFromDOM(m as HTMLElement));
    }
    setPendingPublicSelection(null);
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
      const isPublicAnn = publicAnnotations.some(a => a.id === id);
      if (isPublicAnn) {
        setPublicAnnotations(prev => prev.map(a => a.id === id ? updated : a));
      } else {
        setAnnotations(prev => prev.map(a => a.id === id ? updated : a));
      }
      const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
      if (container) {
        const mark = container.querySelector(`[data-annotation-id="${id}"]`) as HTMLElement | null;
        if (mark) mark.dataset.note = note;
      }
    } catch {}
    setActivePopover(null);
    setIsEditingExistingNote(false);
  }, [publicAnnotations]);

  const activeAnnotation = activePopover
    ? (activePopover.isAuthorNote
        ? publicAnnotations.find(a => a.id === activePopover.annotationId)
        : annotations.find(a => a.id === activePopover.annotationId))
    : null;

  return (
    <div ref={containerRef} className="relative">
      {session && (
        <TextSelectionToolbar
          onHighlight={handleHighlight}
          onAddNote={handleAddNote}
          onRemoveHighlight={handleRemoveHighlight}
          isAuthor={isAuthor}
          onPublicHighlight={isAuthor ? handlePublicHighlight : undefined}
          onAddPublicNote={isAuthor ? handleAddPublicNote : undefined}
        />
      )}

      {children}

      {/* Highlight Action Toolbar */}
      {hoveredHighlight && (
        <HighlightActionToolbar
          isVisible={!!hoveredHighlight}
          element={hoveredHighlight.element}
          rect={hoveredHighlight.rect}
          hideColors={hoveredHighlight.isAuthorMark}
          onDelete={() => handleDeleteFromDOM(hoveredHighlight.id, hoveredHighlight.element)}
          onMouseEnter={() => {
            isHoveringRef.current = true;
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={() => {
            isHoveringRef.current = false;
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = setTimeout(() => {
              if (!isHoveringRef.current) setHoveredHighlight(null);
            }, 400);
          }}
          onChangeColor={async (colorId) => {
            try {
              const updated = await updateAnnotationAction(hoveredHighlight.id, { color: colorId });
              setAnnotations(prev => prev.map(a => a.id === hoveredHighlight.id ? updated : a));
              const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
              if (container) {
                const segments = container.querySelectorAll(`mark.ks-highlight[data-annotation-id="${hoveredHighlight.id}"]`);
                segments.forEach(s => {
                  (s as HTMLElement).dataset.color = colorId;
                  (s as HTMLElement).style.backgroundColor = '';
                });
              }
            } catch {
              import('sonner').then(({ toast }) => toast.error('Cập nhật màu thất bại'));
            }
          }}
        />
      )}

      {/* Personal note editor */}
      <AnimatePresence>
        {pendingSelection && (
          <InlineNoteEditor
            selection={pendingSelection}
            onSave={handleSaveNote}
            onCancel={handleCancelNote}
          />
        )}
      </AnimatePresence>

      {/* Public note editor (author only) */}
      <AnimatePresence>
        {pendingPublicSelection && (
          <InlineNoteEditor
            selection={pendingPublicSelection}
            onSave={handleSavePublicNote}
            onCancel={handleCancelPublicNote}
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
              isAuthorNote={activePopover.isAuthorNote}
              onEdit={!activePopover.isAuthorNote || isAuthor ? () => setIsEditingExistingNote(true) : undefined}
              onDelete={!activePopover.isAuthorNote || isAuthor ? () => {
                const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
                const domEl = container?.querySelector(`[data-annotation-id="${activeAnnotation.id}"]`) as HTMLElement;
                handleDeleteFromDOM(activeAnnotation.id, domEl ?? document.createElement('div'));
                setActivePopover(null);
              } : undefined}
            />
          )
        )}
      </AnimatePresence>

      {/* Hover tooltip — personal note */}
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
              <div className={`relative bg-white dark:bg-[#0f172a] px-4 py-3 rounded-xl shadow-lg border max-w-[260px] ${
                hoveredNote.isAuthorNote
                  ? 'border-violet-300 dark:border-violet-500/50'
                  : 'border-zinc-200 dark:border-white/10'
              }`}>
                <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200 font-medium line-clamp-5">
                  {hoveredNote.content}
                </p>

                <div className={`mt-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.15em] ${
                  hoveredNote.isAuthorNote ? 'text-violet-500' : 'text-blue-500/80'
                }`}>
                  <div className="w-1 h-1 rounded-full bg-current" />
                  <span>{hoveredNote.isAuthorNote ? 'Ghi chú của tác giả' : 'Ghi chú'}</span>
                </div>
              </div>

              <div className={`absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-white dark:bg-[#0f172a] rotate-45 border-r border-b ${
                hoveredNote.isAuthorNote
                  ? 'border-violet-300 dark:border-violet-500/50'
                  : 'border-zinc-200 dark:border-white/10'
              }`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
