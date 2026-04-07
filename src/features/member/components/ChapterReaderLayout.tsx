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

    return () => {
      window.removeEventListener('toggle-chapter-notes', handleToggleNotes);
      document.removeEventListener('click', handleNoteClick);
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
          mark.style.backgroundColor = color;
          mark.title = 'Click để xóa highlight';
          
          // Hover delete button
          const deleteBtn = document.createElement('span');
          deleteBtn.className = 'ks-highlight-delete';
          deleteBtn.innerHTML = '×';
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            const p = mark.parentNode;
            if (p) {
              while (mark.firstChild && mark.firstChild !== deleteBtn) {
                p.insertBefore(mark.firstChild, mark);
              }
              p.removeChild(mark);
            }
          };
          
          // Click highlight to remove (backward compatibility)
          mark.onclick = () => {
            const p = mark.parentNode;
            if (p) {
              while (mark.firstChild && mark.firstChild !== deleteBtn) {
                p.insertBefore(mark.firstChild, mark);
              }
              p.removeChild(mark);
            }
          };

          try {
            range.surroundContents(mark);
            mark.appendChild(deleteBtn);
          } catch (e) {
            const fragment = range.extractContents();
            mark.appendChild(fragment);
            mark.appendChild(deleteBtn);
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
