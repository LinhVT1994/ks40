'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import TextSelectionToolbar from '@/features/member/components/notes/TextSelectionToolbar';
import InlineNoteEditor from '@/features/member/components/notes/InlineNoteEditor';
import NotePopover from '@/features/member/components/notes/NotePopover';
import {
  createAnnotationAction,
  deleteAnnotationAction,
  updateAnnotationAction,
  type ArticleAnnotation,
} from '@/features/articles/actions/annotation';

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

/**
 * Find all "leaf block" elements inside container.
 * MarkdownViewer renders <p> as <div>, so we include divs that
 * don't have other block-level children.
 */
function getBlockElements(container: Element): Element[] {
  const BLOCK_CHILD_TAGS = new Set([
    'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'TABLE', 'SECTION', 'ARTICLE',
  ]);

  const candidates = Array.from(
    container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, td, th, div'),
  );

  return candidates.filter(el => {
    if (!el.textContent?.trim()) return false;
    // Keep only leaf-level blocks (no block-level children)
    const hasBlockChild = Array.from(el.children).some(c => BLOCK_CHILD_TAGS.has(c.tagName));
    return !hasBlockChild;
  });
}

function captureSelectionPosition(
  range: Range,
  container: Element,
): { paragraphIndex: number; startOffset: number; endOffset: number } | null {
  const blocks = getBlockElements(container);

  let paragraphIndex = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].contains(range.startContainer)) {
      paragraphIndex = i;
      break;
    }
  }
  if (paragraphIndex === -1) return null;

  const block = blocks[paragraphIndex];

  // Count characters from block start to range start
  const preRange = document.createRange();
  try {
    preRange.setStart(block, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
  } catch {
    return null;
  }
  const startOffset = preRange.toString().length;
  const endOffset = startOffset + range.toString().length;

  return { paragraphIndex, startOffset, endOffset };
}

function applyHighlightToDOM(
  annotation: ArticleAnnotation,
  container: Element,
  onDelete: (id: string, el: HTMLElement) => void,
  onNoteClick: (id: string, rect: DOMRect) => void,
) {
  const blocks = getBlockElements(container);
  const block = blocks[annotation.paragraphIndex];
  if (!block) return;

  // Verify the text still exists in this block
  const blockText = block.textContent ?? '';
  const expectedSlice = blockText.slice(annotation.startOffset, annotation.endOffset);
  if (!expectedSlice || expectedSlice.trim() !== annotation.selectedText.trim()) return;

  // Walk text nodes to find the right position
  const tw = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  let startNode: Text | null = null;
  let startNodeOffset = 0;
  let endNode: Text | null = null;
  let endNodeOffset = 0;

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

    const mark = createMarkElement(annotation, onDelete, onNoteClick);
    try {
      range.surroundContents(mark);
    } catch {
      const fragment = range.extractContents();
      mark.insertBefore(fragment, mark.firstChild);
      range.insertNode(mark);
    }
    // Append delete button AFTER surroundContents so it's inside mark
    if (!annotation.note) {
      const deleteBtn = mark.querySelector('.ks-highlight-delete') as HTMLElement | null;
      if (!deleteBtn) {
        const btn = buildDeleteBtn(annotation.id, mark, onDelete);
        mark.appendChild(btn);
      }
    }
  } catch {
    // Silently skip
  }
}

function createMarkElement(
  annotation: ArticleAnnotation,
  onDelete: (id: string, el: HTMLElement) => void,
  onNoteClick: (id: string, rect: DOMRect) => void,
): HTMLElement {
  const mark = document.createElement('mark');
  mark.className = `ks-highlight${annotation.note ? ' ks-highlight-note' : ''}`;
  mark.style.backgroundColor = colorToHex(annotation.color);
  mark.dataset.annotationId = annotation.id;
  if (annotation.note) mark.dataset.note = annotation.note;

  if (annotation.note) {
    mark.title = 'Nhấn để xem ghi chú';
    mark.onclick = (e) => {
      e.stopPropagation();
      onNoteClick(annotation.id, mark.getBoundingClientRect());
    };
  } else {
    mark.title = 'Nhấn để xóa highlight';
    mark.onclick = (e) => {
      e.stopPropagation();
      onDelete(annotation.id, mark);
    };
  }
  return mark;
}

function buildDeleteBtn(
  annotationId: string,
  mark: HTMLElement,
  onDelete: (id: string, el: HTMLElement) => void,
): HTMLElement {
  const btn = document.createElement('span');
  btn.className = 'ks-highlight-delete';
  btn.innerHTML = '×';
  btn.onclick = (e) => {
    e.stopPropagation();
    onDelete(annotationId, mark);
  };
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

  useEffect(() => {
    onAnnotationsChange?.(annotations);
  }, [annotations, onAnnotationsChange]);

  const handleDeleteFromDOM = useCallback(async (id: string, markEl: HTMLElement) => {
    removeMarkFromDOM(markEl);
    setAnnotations(prev => prev.filter(a => a.id !== id));
    try { await deleteAnnotationAction(id); } catch {}
  }, []);

  const handleNoteClickFromDOM = useCallback((id: string, rect: DOMRect) => {
    setActivePopover({ annotationId: id, rect });
  }, []);

  // Re-apply saved annotations to DOM on mount
  useEffect(() => {
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (!container) return;

    // Remove any stale marks first
    container.querySelectorAll('[data-annotation-id]').forEach(el => {
      removeMarkFromDOM(el as HTMLElement);
    });

    for (const ann of initialAnnotations) {
      applyHighlightToDOM(ann, container, handleDeleteFromDOM, handleNoteClickFromDOM);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHighlight = useCallback(async (text: string, range: Range, colorHex: string) => {
    if (!session?.user?.id) return;
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (!container) return;

    const pos = captureSelectionPosition(range, container);
    if (!pos) return;

    const colorName = colorToName(colorHex);

    // Optimistic DOM update
    const mark = document.createElement('mark');
    mark.className = 'ks-highlight';
    mark.style.backgroundColor = colorToHex(colorHex);
    mark.title = 'Nhấn để xóa highlight';

    try {
      range.surroundContents(mark);
    } catch {
      const fragment = range.extractContents();
      mark.appendChild(fragment);
      range.insertNode(mark);
    }

    const deleteBtn = buildDeleteBtn('pending', mark, (_id, el) => removeMarkFromDOM(el));
    mark.appendChild(deleteBtn);
    window.getSelection()?.removeAllRanges();

    try {
      const saved = await createAnnotationAction({
        articleId,
        selectedText: text.trim(),
        ...pos,
        color: colorName,
      });
      mark.dataset.annotationId = saved.id;
      mark.onclick = (e) => { e.stopPropagation(); handleDeleteFromDOM(saved.id, mark); };
      deleteBtn.onclick = (e) => { e.stopPropagation(); handleDeleteFromDOM(saved.id, mark); };
      setAnnotations(prev => [...prev, saved]);
    } catch {
      removeMarkFromDOM(mark);
    }
  }, [session, articleId, handleDeleteFromDOM]);

  const handleAddNote = useCallback((text: string, range: Range) => {
    const rect = range.getBoundingClientRect();
    const tempMark = document.createElement('mark');
    tempMark.className = 'ks-highlight';
    tempMark.style.backgroundColor = 'rgba(59,130,246,0.2)';
    try {
      range.surroundContents(tempMark);
    } catch {
      const fragment = range.extractContents();
      tempMark.appendChild(fragment);
      range.insertNode(tempMark);
    }
    window.getSelection()?.removeAllRanges();
    setPendingSelection({ text, range, rect });
  }, []);

  const handleSaveNote = useCallback(async (noteContent: string) => {
    if (!pendingSelection || !session?.user?.id) return;
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (!container) return;

    const tempMark = container.querySelector('.ks-highlight:not([data-annotation-id])') as HTMLElement | null;
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
      if (tempMark) {
        tempMark.className = 'ks-highlight ks-highlight-note';
        tempMark.style.backgroundColor = NAME_TO_HEX.yellow;
        tempMark.dataset.annotationId = saved.id;
        tempMark.dataset.note = noteContent;
        tempMark.title = 'Nhấn để xem ghi chú';
        tempMark.onclick = (e) => {
          e.stopPropagation();
          handleNoteClickFromDOM(saved.id, tempMark.getBoundingClientRect());
        };
      }
      setAnnotations(prev => [...prev, saved]);
    } catch {
      if (tempMark) removeMarkFromDOM(tempMark);
    }
    setPendingSelection(null);
  }, [pendingSelection, session, articleId, handleNoteClickFromDOM]);

  const handleCancelNote = useCallback(() => {
    const container = containerRef.current?.querySelector(CONTENT_SELECTOR) ?? containerRef.current;
    if (container) {
      const tempMark = container.querySelector('.ks-highlight:not([data-annotation-id])') as HTMLElement | null;
      if (tempMark) removeMarkFromDOM(tempMark);
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
          <NotePopover
            rect={activePopover.rect}
            content={activeAnnotation.note}
            onClose={() => setActivePopover(null)}
            onEdit={() => {
              const newNote = prompt('Chỉnh sửa ghi chú:', activeAnnotation.note ?? '');
              if (newNote !== null) handleUpdateNote(activeAnnotation.id, newNote);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
