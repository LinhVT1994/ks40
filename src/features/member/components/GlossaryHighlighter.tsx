'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { getGlossarySearchDataAction } from '@/features/admin/actions/glossary';

type GlossaryTermInfo = {
  id: string;
  term: string;
  slug: string;
  shortDef: string;
};

const GlossaryContext = createContext<GlossaryTermInfo[]>([]);

let cachedTerms: GlossaryTermInfo[] | null = null;
let fetchPromise: Promise<GlossaryTermInfo[]> | null = null;

export function GlossaryProvider({ children }: { children: React.ReactNode }) {
  const [terms, setTerms] = useState<GlossaryTermInfo[]>(cachedTerms || []);

  useEffect(() => {
    if (cachedTerms) return;
    
    if (!fetchPromise) {
      fetchPromise = getGlossarySearchDataAction().then(data => {
        cachedTerms = data;
        return data;
      });
    }
    
    fetchPromise.then(setTerms);
  }, []);

  return (
    <GlossaryContext.Provider value={terms}>
      {children}
    </GlossaryContext.Provider>
  );
}

export function useGlossaryTerms() {
  return useContext(GlossaryContext);
}



export function GlossaryTooltip({ term }: { term: GlossaryTermInfo }) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLAnchorElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isVisible) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX
      });
    }
  };

  const handleMouseEnter = () => {
    // Chỉ chạy trên device có hover thật (chuột/trackpad). iPad/iPhone trong chế độ
    // touch sẽ phát synthetic mouseenter khi chạm — bỏ qua để không bật tooltip ngoài ý muốn.
    if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) return;
    updateCoords();
    setIsVisible(true);
  };

  return (
    <>
      <a
        ref={triggerRef}
        href={`/glossary/${term.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          // Trên touch device (iPad/iPhone): tap đầu hiện tooltip thay vì navigate.
          // Click chỉ fire khi user tap thật (không scroll, không long-press), nên text-select
          // qua long-press vẫn hoạt động bình thường.
          if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) {
            e.preventDefault();
            if (isVisible) {
              setIsVisible(false);
            } else {
              updateCoords();
              setIsVisible(true);
            }
          }
        }}
        style={{ fontWeight: 'inherit', color: 'inherit' }}
        className="ks-glossary-term inline cursor-pointer relative transition-colors"
      >
        {term.term}
      </a>

      {mounted && createPortal(
        <AnimatePresence>
          {isVisible && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', pointerEvents: 'none', zIndex: 99999 }}>
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{ 
                  position: 'absolute', 
                  top: coords.top - 12, // Reduced slightly as -translate-y-full adds enough gap
                  left: coords.left,
                }}
                className="w-64 min-w-[256px] p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-2xl pointer-events-auto block -translate-x-1/2 -translate-y-full"
              >
                <Link href={`/glossary/${term.slug}`} target="_blank" className="block space-y-2 not-italic font-sans text-left normal-case tracking-normal whitespace-normal">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary">Thuật ngữ</span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{term.term}</h4>
                  <p className="text-xs text-zinc-600 dark:text-slate-400 leading-relaxed italic">
                    {term.shortDef}
                  </p>
                  <div className="pt-1 text-[10px] font-bold text-primary flex items-center gap-1">
                    Nhấn để xem định nghĩa →
                  </div>
                </Link>
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid white'
                  }} 
                  className="dark:!border-t-zinc-900"
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export function AutoGlossaryHighlight({ children }: { children: React.ReactNode }) {
  const terms = useGlossaryTerms();

  const processNode = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string') {
      if (!terms.length || !node) return node;

      const sortedTerms = [...terms].sort((a, b) => b.term.length - a.term.length);
      const termNames = sortedTerms.map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

      // No lookbehind — Safari iOS <16.4 throws on (?<=...). We capture the leading
      // boundary as a group and use a non-consuming lookahead for the trailing boundary
      // so adjacent matches (e.g. "AI và AI") aren't blocked by a consumed separator.
      const boundaryChars = `[\\s,.:;"'!?()\\-\\[\\]{}<>]`;
      const regexStr = `(^|${boundaryChars})(${termNames.join('|')})(?=${boundaryChars}|$)`;
      const regex = new RegExp(regexStr, 'gi');

      const parts = node.split(regex);
      return parts.map((part, index) => {
        // The split with 2 capturing groups results in:
        // [text_before, preceding_char, term, text_before, preceding_char, term, ...]
        // The matched term is always at index % 3 === 2
        if (index % 3 === 2) {
          const matchingTerm = sortedTerms.find(t => t.term.toLowerCase() === part.toLowerCase());
          if (matchingTerm) {
            return <GlossaryTooltip key={`${matchingTerm.id}-${index}`} term={matchingTerm} />;
          }
        }
        return part;
      });
    }

    if (React.isValidElement(node)) {
      // Skip highlighting inside links, code, etc.
      const type = node.type as any;
      const typeName = typeof type === 'string' ? type : type?.name || type?.displayName;
      if (['a', 'code', 'pre', 'button', 'Link', 'GlossaryTooltip'].includes(typeName)) {
        return node;
      }

      const nodeProps = node.props as any;
      if (nodeProps?.children) {
        return React.cloneElement(node as React.ReactElement<any>, {
          ...nodeProps,
          children: React.Children.map(nodeProps.children, processNode),
        });
      }
    }

    if (Array.isArray(node)) {
      return node.map(processNode);
    }

    return node;
  };

  return <>{processNode(children)}</>;
}
