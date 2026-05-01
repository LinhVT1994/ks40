'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, List } from 'lucide-react';
import { smoothScrollTo } from '@/lib/scroll-utils';
import { useInteractionOptional } from '@/features/articles/context/ArticleInteractionContext';

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
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false); // Scrolling down
      } else {
        setIsVisible(true); // Scrolling up
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const interaction = useInteractionOptional();
  const sidebarsVisible = interaction?.sidebarsVisible ?? true;
  const showSidebars = interaction?.showSidebars ?? (() => {});
  const hideSidebars = interaction?.hideSidebars ?? (() => {});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollLockRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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

    // OFFSET matches scroll-margin-top (100px) so the active heading after
    // clicking in the TOC is the same one the scroll handler would compute.
    const OFFSET = 100;

    const getActive = () => {
      let current = '';
      for (const { id } of headings) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= OFFSET) current = id;
      }
      if (!current) {
        const firstEl = document.getElementById(headings[0].id);
        if (firstEl && firstEl.getBoundingClientRect().top < window.innerHeight) {
          current = headings[0].id;
        }
      }
      return current;
    };

    const handleScroll = () => {
      // Skip scroll-handler updates while a click-triggered scroll animation
      // is in progress — otherwise intermediate positions override the clicked id.
      if (scrollLockRef.current) return;
      setActiveId(getActive());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    setActiveId(getActive());
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
      setIndicatorStyle({ top, height: elRect.height, opacity: 1 });
    }
  }, [activeId, headings]);

  useEffect(() => {
    if (!isOpen) return;

    // Add scroll lock for mobile
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (window.innerWidth < 1280) { // xl breakpoint
      document.body.style.overflow = 'hidden';
    }

    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = originalStyle;
      document.removeEventListener('keydown', handleKey);
    };
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
    // Lock scroll handler for the duration of the animation so intermediate
    // scroll positions don't overwrite the id we just set above.
    if (scrollLockRef.current) clearTimeout(scrollLockRef.current);
    scrollLockRef.current = setTimeout(() => { scrollLockRef.current = null; }, 900);

    const rect = el.getBoundingClientRect();
    const targetY = rect.top + window.scrollY - 100;
    smoothScrollTo(targetY, 800);
  };

  if (headings.length === 0) return null;

  const isLeft = side === 'left';

  return (
    <>
      {/* Backdrop (Mobile & Tablet Drawer only) */}
      <div 
        className={`fixed inset-0 z-[90] bg-zinc-800/10 dark:bg-slate-950/40 xl:hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto backdrop-blur-sm' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Floating Trigger (Mobile & Tablet only) */}
      <div
        className={`fixed top-24 right-4 z-40 cursor-pointer transition-all duration-500 xl:hidden ${
          (isOpen || !isVisible) 
            ? 'opacity-0 -translate-y-20 pointer-events-none' 
            : 'opacity-100 translate-y-0'
        }`}
        onClick={() => setIsOpen(true)}
        title="Mục lục"
      >
        <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-zinc-200 dark:border-white/10 shadow-xl flex items-center justify-center text-zinc-600 dark:text-slate-400 active:scale-95 transition-all">
          <List className="w-5 h-5" />
        </div>
      </div>

      {/* TOC Panel: Centered Modal on Mobile, Sticky Sidebar on Desktop */}
      <div
        className={`
          fixed z-[100] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
          /* Centered Modal Mode (< xl) */
          left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[min(360px,90vw)] max-h-[70vh] rounded-2xl
          bg-white dark:bg-slate-900 shadow-2xl
          border border-zinc-200 dark:border-white/10
          pt-12 pb-6 flex flex-col
          /* Sidebar Mode (≥ xl) */
          xl:static xl:left-auto xl:top-auto xl:translate-x-0 xl:translate-y-0
          xl:w-full xl:max-h-[calc(100vh-160px)] xl:rounded-none xl:bg-transparent xl:dark:bg-transparent
          xl:backdrop-blur-0 xl:shadow-none xl:border-0 xl:pt-0 xl:pb-0 xl:pointer-events-auto
          ${isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
          }
          ${sidebarsVisible ? 'xl:opacity-0 xl:hover:opacity-100 xl:pointer-events-auto' : 'xl:opacity-0'}
          ${focusActive ? 'xl:!opacity-0 xl:pointer-events-none' : ''}
          transition-opacity duration-500
          group
        `}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        {/* Full-height Hover Trigger Zone (Desktop only) */}
        <div 
          className="hidden xl:block absolute top-[-100vh] bottom-[-100vh] -left-20 -right-10 z-[-1] pointer-events-auto"
          onMouseEnter={handleMouseEnter}
        />

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
             Mục lục
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
                  className={`block relative py-1.5 transition-all duration-300 cursor-pointer group z-10 pl-0`}
                >
                  <div className={`text-[13px] leading-relaxed transition-colors duration-300 px-4 ${
                    level === 1 ? 'font-bold' : 'font-medium'
                  } ${
                    isActive
                      ? 'text-primary'
                      : 'text-zinc-500 dark:text-slate-500 hover:text-zinc-800 dark:hover:text-white'
                  } ${isLeft ? 'text-left' : 'text-right'}`}>
                    {text}
                  </div>
                </a>
              );
            })}
          </div>
        </nav>

        {/* Focus Mode toggle — Pushed to bottom with mt-auto */}
        <div className="mt-auto mx-3 xl:mx-0 pt-4 border-t border-zinc-200 dark:border-white/5">
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
