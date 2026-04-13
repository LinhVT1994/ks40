'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Lock, X, ChevronLeft } from 'lucide-react';

type Chapter = {
  id: string;
  title: string;
  slug: string;
  order: number;
  isFree?: boolean;
  isCompleted?: boolean;
};

type ChapterSidebarProps = {
  bookTitle: string;
  bookSlug: string;
  chapters: Chapter[];
  activeChapterSlug: string;
  side?: 'left' | 'right';
  externalOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
};

export default function ChapterSidebar({ 
  bookSlug, 
  chapters, 
  activeChapterSlug,
  side = 'left',
  externalOpen,
  onOpen,
  onClose
}: ChapterSidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  
  const setIsOpen = (val: boolean) => {
    if (val) {
      if (onOpen) onOpen();
    } else {
      if (onClose) onClose();
    }
    setInternalOpen(val);
  };

  const isLeft = side === 'left';

  // Close sidebar on escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 800);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <>
      {/* Backdrop (Mobile & Desktop Overlay) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[90] bg-zinc-800/10 dark:bg-slate-950/40 backdrop-blur-sm lg:backdrop-blur-[2px] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Closed indicator (Desktop Only) */}
      <div
        data-focus-hide
        className={`fixed top-[calc(50%_+_36px)] -translate-y-1/2 z-40 flex items-center justify-center cursor-pointer transition-opacity duration-200 group w-8 h-32 ${
          isLeft ? 'left-0' : 'right-0'
        } ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 hidden lg:flex'
        }`}
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => !externalOpen && setIsOpen(true)}
        title="Curriculum"
      >
        <div className={`select-none ${isLeft ? '-rotate-90' : 'rotate-90'} origin-center whitespace-nowrap opacity-20 group-hover:opacity-100 transition-opacity duration-300`}>
           <span className="text-[10px] font-black text-zinc-500 dark:text-slate-400 uppercase tracking-[0.6em] flex items-center gap-4">
              <ChevronLeft className={`w-3 h-3 ${isLeft ? 'rotate-90' : '-rotate-90'}`} /> Curriculum
           </span>
        </div>
      </div>

      <div 
        data-focus-hide
        className={`fixed top-0 h-full z-[100] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isLeft ? 'left-0' : 'right-0'} ${isOpen ? 'w-full sm:w-64' : 'w-0 lg:w-2'}`}
      >
        {/* Panel */}
        <aside
          className={`absolute top-0 w-full sm:w-64 h-full lg:h-screen bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl shadow-2xl pt-[100px] pb-7 flex flex-col justify-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isLeft ? 'left-0 border-r translate-x-0' : 'right-0 border-l'
          } border-zinc-200 dark:border-white/5 ${
            isOpen 
              ? 'opacity-100 translate-x-0' 
              : `opacity-0 ${isLeft ? '-translate-x-full' : 'translate-x-full'}`
          }`}
          onMouseLeave={() => !externalOpen && scheduleClose()}
          onMouseEnter={() => !externalOpen && cancelClose()}
        >
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden absolute top-[76px] right-6 p-2 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-slate-400 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <nav className="flex flex-col overflow-y-auto max-h-[80vh] px-5">
            <div className="mb-6 flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.4em]">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               Curriculum
            </div>
            
            <div className="space-y-1">
              {chapters.map((chapter) => {
                const isActive = chapter.slug === activeChapterSlug;
                return (
                  <Link
                    key={chapter.id}
                    href={`/books/${bookSlug}/${chapter.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="block relative py-2.5 transition-all duration-150 cursor-pointer group"
                  >
                    <div className={`flex flex-col justify-center transition-colors duration-150 px-3 ${
                      isActive
                        ? ''
                        : 'opacity-70 group-hover:opacity-100'
                    }`}>
                      
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 flex items-center gap-2 ${isActive ? 'text-primary' : 'text-zinc-500'}`}>
                          Phase {String(chapter.order).padStart(2, '0')}
                          {chapter.isCompleted && (
                             <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          )}
                          {!chapter.isFree && false && (
                             <Lock className="w-3 h-3 text-zinc-500" />
                          )}
                        </div>
                        <div className={`text-[13px] leading-snug line-clamp-2 font-semibold ${
                          isActive
                            ? 'text-primary'
                            : 'text-zinc-700 dark:text-slate-300 group-hover:text-zinc-800 dark:group-hover:text-white'
                        }`}>
                          {chapter.title}
                        </div>
                      </div>

                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>
      </div>
    </>
  );
}
