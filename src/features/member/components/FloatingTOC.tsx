'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { smoothScrollTo } from '@/lib/scroll-utils';
import { useInteraction } from '@/features/articles/context/ArticleInteractionContext';

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
  const [isMoving, setIsMoving] = useState(false);

  const { sidebarsVisible, showSidebars, hideSidebars } = useInteraction();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const itemRefs = useRef<Map<string, HTMLAnchorElement | null>>(new Map());
  const listRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });

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
      // Active heading = last heading whose top has scrolled past 1/3 of the viewport.
      // This avoids the "off by one" feel where the next heading lights up the moment it
      // enters the top edge, even though the reader is still finishing the previous section.
      const triggerLine = Math.max(160, window.innerHeight * 0.33);
      let current = '';
      for (const { id } of headings) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= triggerLine) current = id;
        }
      }
      // Fallback: if no heading has crossed the line yet but we're near the top, pick the first one
      if (!current && headings.length > 0) {
        const firstEl = document.getElementById(headings[0].id);
        if (firstEl && firstEl.getBoundingClientRect().top <= window.innerHeight) {
          current = headings[0].id;
        }
      }
      setActiveId(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  useEffect(() => {
    if (!activeId) {
      setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }
    const activeEl = itemRefs.current.get(activeId);
    const container = listRef.current;
    if (activeEl && container) {
      const elRect = activeEl.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      const top = elRect.top - contRect.top;
      setIsMoving(true);
      setIndicatorStyle({ top, height: elRect.height, opacity: 1 });
      const timer = setTimeout(() => setIsMoving(false), 500);
      return () => clearTimeout(timer);
    }
  }, [activeId, headings]);

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

  const handleMouseEnter = () => {
    if (externalOpen) return;
    showSidebars();
  };

  const handleMouseLeave = () => {
    if (externalOpen) return;
    hideSidebars();
    scheduleClose();
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 800);
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const handleHeadingClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (onClose) onClose();
    setInternalOpen(false);

    // Optimistically set active immediately so the indicator follows the click
    // without waiting for the scroll handler — avoids "off by one" during animation.
    setActiveId(id);

    // Use document-relative position (rect.top + window.scrollY) instead of offsetTop,
    // since offsetTop is relative to offsetParent and can be wrong for nested layouts.
    const rect = el.getBoundingClientRect();
    const targetY = rect.top + window.scrollY - 110;
    smoothScrollTo(targetY, 1000);
  };

  if (headings.length === 0) return null;

  const isLeft = side === 'left';

  return (
    <>
      {/* Backdrop (Mobile & Tablet Drawer only) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[90] bg-zinc-800/10 dark:bg-slate-950/40 backdrop-blur-sm xl:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Trigger (Mobile & Tablet only) */}
      <div
        className={`fixed top-[calc(50%_+_36px)] -translate-y-1/2 z-40 flex flex-col gap-4 cursor-pointer transition-opacity duration-200 xl:hidden ${
          isLeft ? 'left-3' : 'right-3'
        } ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => !externalOpen && setIsOpen(true)}
        title="Mục lục"
      >
        <div className={`flex flex-col gap-1.5 ${isLeft ? 'items-start' : 'items-end'}`}>
          <span className="block w-5 h-0.5 rounded-full bg-zinc-300 dark:bg-white/20" />
          <span className="block w-3.5 h-0.5 rounded-full bg-zinc-300 dark:bg-white/20" />
          <span className="block w-4 h-0.5 rounded-full bg-zinc-300 dark:bg-white/20" />
          <span className="block w-3 h-0.5 rounded-full bg-zinc-300 dark:bg-white/20" />
        </div>
      </div>

      {/* TOC Panel: Centered Modal on Mobile, Sticky Sidebar on Desktop */}
      <div
        className={`
          fixed z-[100] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
          /* Centered Modal Mode (< xl) */
          left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[min(360px,90vw)] max-h-[70vh] rounded-2xl
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl
          border border-zinc-200 dark:border-white/10
          pt-12 pb-6 flex flex-col
          /* Sidebar Mode (≥ xl) */
          xl:static xl:left-auto xl:top-auto xl:translate-x-0 xl:translate-y-0
          xl:w-full xl:max-h-[calc(100vh-160px)] xl:rounded-none xl:bg-transparent xl:dark:bg-transparent
          xl:backdrop-blur-0 xl:shadow-none xl:border-0 xl:pt-0 xl:pb-0 xl:pointer-events-auto
          ${isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
          }
          ${sidebarsVisible ? 'xl:!opacity-100 xl:!pointer-events-auto xl:!scale-100' : 'xl:opacity-0 xl:scale-100'}
          ${focusActive ? 'xl:!opacity-0 xl:pointer-events-none' : ''}
          group
        `}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="xl:hidden absolute top-4 right-4 p-2 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-slate-400 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <nav className={`flex flex-col overflow-y-auto flex-1 xl:max-h-none ${isLeft ? 'pl-5 pr-4 xl:pl-0 xl:pr-0' : 'pr-5 pl-4 items-end xl:pr-0 xl:pl-0'}`}>
          <div className={`px-3 mb-6 flex items-center gap-3 text-[11px] font-black text-primary/50 dark:text-primary/40 uppercase tracking-[0.4em] ${isLeft ? '' : 'flex-row-reverse'}`}>
             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
             Contents
          </div>
          
          <div ref={listRef} className="flex flex-col gap-0 relative">
            {/* Sliding Active Indicator */}
            <div
              className={`absolute z-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isLeft ? 'left-0 border-l-2' : 'right-0 border-r-2'} border-primary rounded-full pointer-events-none`}
              style={{
                top: `${indicatorStyle.top}px`,
                height: `${indicatorStyle.height}px`,
                opacity: indicatorStyle.opacity
              }}
            />

            {headings.map(({ id, text, level }) => {
              const isActive = activeId === id;
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  ref={el => { itemRefs.current.set(id, el); }}
                  onClick={e => {
                    e.preventDefault();
                    handleHeadingClick(id);
                  }}
                  className={`block relative py-1.5 transition-all duration-300 cursor-pointer group z-10 ${
                    level === 3 ? (isLeft ? 'pl-4' : 'pr-4') : 'pl-0'
                  }`}
                >
                  <div className={`text-[14px] leading-relaxed transition-all duration-300 px-4 ${
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-zinc-500 dark:text-slate-500 font-medium hover:text-zinc-800 dark:hover:text-white'
                  } ${isLeft ? 'text-left' : 'text-right'}`}>
                    {text}
                  </div>
                </a>
              );
            })}
          </div>
        </nav>

        {/* Focus Mode toggle — Pushed to bottom with mt-auto */}
        <div className="mt-auto mx-3 xl:mx-0 pt-4 border-t border-zinc-200 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-focus-mode'))}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-bold transition-all ${
              focusActive
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-zinc-400 dark:text-slate-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-800 dark:hover:text-white'
            }`}
          >
            {focusActive ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Thoát</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Focus</span>
              </>
            )}
            <kbd className="ml-auto text-[9px] opacity-40 bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/10 font-sans">F</kbd>
          </button>
        </div>
      </div>
    </>
  );
}
