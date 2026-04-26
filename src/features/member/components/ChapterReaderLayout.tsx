'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChapterSidebar from './ChapterSidebar';
import ChapterReader from './ChapterReader';
import FloatingTOC from './FloatingTOC';
import MobileNavHub from './MobileNavHub';
import FocusMode from './FocusMode';
import TextSelectionToolbar from './notes/TextSelectionToolbar';
import ChapterNotesPanel from './notes/ChapterNotesPanel';
import InlineNoteEditor from './notes/InlineNoteEditor';
import NotePopover from './notes/NotePopover';
import HighlightActionToolbar from './notes/HighlightActionToolbar';

interface ChapterReaderLayoutProps {
  book: any;
  currentChapter: any;
  prevChapter: any;
  nextChapter: any;
  headings: any[];
}

export default function ChapterReaderLayout({ 
  book, 
  currentChapter, 
  prevChapter, 
  nextChapter,
  headings 
}: ChapterReaderLayoutProps) {
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [activeNoteSelection, setActiveNoteSelection] = useState<{ text: string; range: Range; rect: DOMRect; tempMark?: HTMLElement } | null>(null);
  const [activePopover, setActivePopover] = useState<{ rect: DOMRect; content: string } | null>(null);
  const [hoveredHighlight, setHoveredHighlight] = useState<{ element: HTMLElement; rect: DOMRect } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);

  // ── Global Event Handlers ─────────────────────────────────────
  useEffect(() => {
    const handleToggleNotes = () => setNotesOpen(prev => !prev);
    window.addEventListener('toggle-chapter-notes', handleToggleNotes);
    
    const handleNoteClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('.ks-highlight-note')) {
        const rect = target.getBoundingClientRect();
        const content = target.getAttribute('data-note') || 'Ghi chú thử nghiệm cho đoạn văn này.';
        setActivePopover({ rect, content });
      }
    };
    document.addEventListener('click', handleNoteClick);

    // ── Highlight Hover Handling ──────────────────────────────
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const highlight = target.closest('.ks-highlight') as HTMLElement;
      const toolbar = target.closest('[data-highlight-toolbar]');
      
      if (highlight || toolbar) {
        isHoveringRef.current = true;
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        if (highlight) {
          setHoveredHighlight({
            element: highlight,
            rect: highlight.getBoundingClientRect()
          });
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement;
      if (related?.closest('.ks-highlight') || related?.closest('[data-highlight-toolbar]')) {
        return;
      }

      isHoveringRef.current = false;
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isHoveringRef.current) {
          setHoveredHighlight(null);
        }
      }, 400); // Optimized delay: 400ms
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('toggle-chapter-notes', handleToggleNotes);
      document.removeEventListener('click', handleNoteClick);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {/* Universal Focus Mode Controller */}
      <FocusMode 
        readTime={currentChapter.readTime} 
        headings={headings} 
        onToggleNotes={() => setNotesOpen(!notesOpen)}
      />

      {/* Floating Toolbar for Text Selection */}
      <TextSelectionToolbar 
        onAddNote={(text, range) => {
          const rect = range.getBoundingClientRect();
          
          let tempMark: HTMLElement | undefined;
          const mark = document.createElement('mark');
          mark.className = 'bg-blue-500/20 text-inherit ks-temp-note-selection rounded flex-inline transition-colors duration-300';
          
          try {
            range.surroundContents(mark);
            tempMark = mark;
          } catch (e) {
            const fragment = range.extractContents();
            mark.appendChild(fragment);
            range.insertNode(mark);
            tempMark = mark;
          }
          window.getSelection()?.removeAllRanges();
          
          setActiveNoteSelection({ text, range, rect, tempMark });
        }}
        onHighlight={(text, range, color) => {
          const mark = document.createElement('mark');
          mark.className = 'ks-highlight animate-in fade-in duration-500';
          
          // Map hex back to color ID for CSS variables
          const colorObj = [
            { id: 'yellow', color: '#fef08a' },
            { id: 'green',  color: '#bbf7d0' },
            { id: 'blue',   color: '#bfdbfe' },
            { id: 'pink',   color: '#fbcfe8' },
          ].find(c => c.color === color);
          
          if (colorObj) {
            mark.dataset.color = colorObj.id;
          } else {
            mark.style.backgroundColor = color; // Fallback
          }
          
          mark.title = 'Click để xem tùy chọn';
          
          try {
            range.surroundContents(mark);
          } catch (e) {
            const fragment = range.extractContents();
            mark.appendChild(fragment);
            range.insertNode(mark);
          }
          window.getSelection()?.removeAllRanges();
        }}
        onRemoveHighlight={(range) => {
          const mark = range.startContainer.parentElement?.closest('.ks-highlight') || 
                       range.endContainer.parentElement?.closest('.ks-highlight');
          if (mark) {
            const el = mark as HTMLElement;
            const p = el.parentNode;
            if (p) {
              while (el.firstChild) p.insertBefore(el.firstChild, el);
              p.removeChild(el);
            }
          }
        }}
      />

      {/* Slide-over Notes Panel */}
      <ChapterNotesPanel 
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
        chapterTitle={currentChapter.title}
      />

      {/* Highlight Action Toolbar */}
      {hoveredHighlight && (
        <HighlightActionToolbar 
          isVisible={!!hoveredHighlight}
          element={hoveredHighlight.element}
          rect={hoveredHighlight.rect}
          onDelete={() => {
            const el = hoveredHighlight.element;
            const p = el.parentNode;
            if (p) {
              while (el.firstChild) p.insertBefore(el.firstChild, el);
              p.removeChild(el);
              setHoveredHighlight(null);
            }
          }}
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
          onChangeColor={(colorId) => {
            if (hoveredHighlight.element) {
              hoveredHighlight.element.dataset.color = colorId;
              hoveredHighlight.element.style.backgroundColor = ''; // Remove inline style to use CSS variable opacity
            }
          }}
        />
      )}

      <AnimatePresence>
        {activePopover && (
          <NotePopover 
            rect={activePopover.rect}
            content={activePopover.content}
            onClose={() => setActivePopover(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeNoteSelection && (
          <InlineNoteEditor 
            selection={activeNoteSelection}
            onSave={(note) => {
              console.log('Saving note:', note, 'for text:', activeNoteSelection.text);
              
              // Convert temporary mark to a clickable KsHighlight Note
              const mark = activeNoteSelection.tempMark;
              if (mark) {
                mark.className = 'ks-highlight-note';
                mark.setAttribute('data-note', note);
              }

              setActiveNoteSelection(null);
            }}
            onCancel={() => {
              // Remove temporary mark
              const mark = activeNoteSelection.tempMark;
              if (mark && mark.parentNode) {
                const p = mark.parentNode;
                while (mark.firstChild) p.insertBefore(mark.firstChild, mark);
                p.removeChild(mark);
              }

              setActiveNoteSelection(null);
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex relative" data-focus-grid>
        {/* Floating TOC for Chapter Content (Left Side) - Now responsive */}
        <FloatingTOC 
          headings={headings} 
          side="left" 
          externalOpen={tocOpen}
          onOpen={() => setTocOpen(true)}
          onClose={() => setTocOpen(false)}
        />

        {/* Main Reader Content */}
        <main className="flex-1 min-w-0" data-focus-main>
          <ChapterReader
            bookSlug={book.slug}
            chapter={currentChapter}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
          />
        </main>

        {/* Sidebar - Desktop auto-hide + Mobile drawer (Right Side) */}
        <ChapterSidebar
          bookTitle={book.title}
          bookSlug={book.slug}
          chapters={book.chapters}
          activeChapterSlug={currentChapter.slug}
          side="right"
          externalOpen={syllabusOpen}
          onOpen={() => setSyllabusOpen(true)}
          onClose={() => setSyllabusOpen(false)}
        />
      </div>

      {/* Mobile Navigation Hub (Floating Bottom Bar) */}
      <MobileNavHub 
        bookSlug={book.slug}
        progress={Math.round(((currentChapter.order - 1) / book.chapters.length) * 100)}
        onToggleSyllabus={() => {
          setTocOpen(false); // Only one open at a time for mobile
          setSyllabusOpen(!syllabusOpen);
        }}
        onToggleTOC={() => {
          setSyllabusOpen(false);
          setTocOpen(!tocOpen);
        }}
      />
    </div>
  );
}
