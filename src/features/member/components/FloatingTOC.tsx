'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

type Heading = { level: number; text: string; id: string };

interface FloatingTOCProps {
  headings: Heading[];
  side?: 'left' | 'right';
  externalOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export default function FloatingTOC({ 
  headings, 
  side = 'left',
  externalOpen,
  onOpen,
  onClose
}: FloatingTOCProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [focusActive, setFocusActive] = useState(false);
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

  useEffect(() => {
    if (headings.length === 0) return;
    const handleScroll = () => {
      let current = '';
      for (const { id } of headings) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= 110) current = id; // Threshold slightly above scroll-margin-top
        }
      }
      setActiveId(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: Event) => {
      setFocusActive((e as CustomEvent).detail?.active ?? false);
    };
    window.addEventListener('focus-mode-changed', handler);
    return () => window.removeEventListener('focus-mode-changed', handler);
  }, []);

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 800);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  if (headings.length === 0) return null;

  const isLeft = side === 'left';

  return (
    <>
      {/* Backdrop (Mobile & Desktop Overlay) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[90] bg-slate-900/10 dark:bg-slate-950/40 backdrop-blur-sm lg:backdrop-blur-[2px] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-[calc(50%_+_36px)] -translate-y-1/2 z-40 flex flex-col gap-4 cursor-pointer transition-opacity duration-200 ${
          isLeft ? 'left-3' : 'right-3'
        } ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 hidden lg:flex'
        }`}
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => !externalOpen && setIsOpen(true)}
        title="Mục lục"
      >
        <div className={`flex flex-col gap-1.5 ${isLeft ? 'items-start' : 'items-end'}`}>
          <span className="block w-5 h-0.5 rounded-full bg-slate-300 dark:bg-white/20" />
          <span className="block w-3.5 h-0.5 rounded-full bg-slate-300 dark:bg-white/20" />
          <span className="block w-4 h-0.5 rounded-full bg-slate-300 dark:bg-white/20" />
          <span className="block w-3 h-0.5 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>
      </div>

      {/* Panel */}
      <div
        className={`fixed top-0 z-[100] w-full sm:w-64 h-full lg:h-screen bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl shadow-2xl pt-[100px] pb-7 flex flex-col justify-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isLeft ? 'left-0 border-r' : 'right-0 border-l'
        } border-slate-100 dark:border-white/5 ${
          isOpen 
            ? 'opacity-100 translate-x-0' 
            : `opacity-0 ${isLeft ? '-translate-x-full' : 'translate-x-full'} pointer-events-none`
        }`}
        onMouseLeave={() => !externalOpen && scheduleClose()}
        onMouseEnter={() => !externalOpen && cancelClose()}
      >
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-[76px] right-6 p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <nav className={`flex flex-col overflow-y-auto max-h-[70vh] ${isLeft ? 'pl-5 pr-4' : 'pr-5 pl-4 items-end'}`}>
          <div className={`px-3 mb-6 flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.4em] ${isLeft ? '' : 'flex-row-reverse'}`}>
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
             Contents
          </div>
          
          {headings.map(({ id, text, level }) => {
            const isActive = activeId === id;
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={e => {
                  e.preventDefault();
                  const el = document.getElementById(id);
                  if (!el) return;
                  if (onClose) onClose();
                  setInternalOpen(false);
                  el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`block relative py-2.5 transition-all duration-150 cursor-pointer group ${
                  level === 3 ? (isLeft ? 'pl-4' : 'pr-4') : 'pl-0'
                }`}
              >
                <div className={`text-[13px] leading-snug line-clamp-2 transition-colors duration-150 px-3 font-semibold ${
                  isActive
                    ? 'text-primary'
                    : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                } ${isLeft ? 'text-left' : 'text-right'}`}>
                  {text}
                </div>
              </a>
            );
          })}
        </nav>

        {/* Focus Mode toggle */}
        <div className="mt-6 mx-3 pt-4 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-focus-mode'))}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              focusActive
                ? 'bg-primary/10 text-primary'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {focusActive
              ? <><Minimize2 className="w-4 h-4" /> Thoát tập trung</>
              : <><Maximize2 className="w-4 h-4" /> Chế độ tập trung</>
            }
            <kbd className="ml-auto text-[10px] opacity-40 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">F</kbd>
          </button>
        </div>
      </div>
    </>
  );
}
