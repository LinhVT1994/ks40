'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Highlighter, FileEdit, X, Check, Eraser, Users, Shield, Globe } from 'lucide-react';

interface TextSelectionToolbarProps {
  onAddNote: (text: string, range: Range) => void;
  onHighlight: (text: string, range: Range, color: string) => void;
  onRemoveHighlight: (range: Range) => void;
  isAuthor?: boolean;
  onAddPublicNote?: (text: string, range: Range) => void;
  onPublicHighlight?: (text: string, range: Range, color: string) => void;
}

const HIGHLIGHT_COLORS = [
  { id: 'yellow', color: '#fef08a', label: 'Vàng' },
  { id: 'green',  color: '#bbf7d0', label: 'Xanh lá' },
  { id: 'blue',   color: '#bfdbfe', label: 'Xanh dương' },
  { id: 'pink',   color: '#fbcfe8', label: 'Hồng' },
];

export default function TextSelectionToolbar({
  onAddNote,
  onHighlight,
  onRemoveHighlight,
  isAuthor,
  onAddPublicNote,
  onPublicHighlight,
}: TextSelectionToolbarProps) {
  const [selection, setSelection] = useState<{
    text: string;
    range: Range;
    rect: DOMRect;
    isHighlighted: boolean;
  } | null>(null);
  const [activeColor, setActiveColor] = useState(HIGHLIGHT_COLORS[0]);
  const [isPublicMode, setIsPublicMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ks_public_mode') === 'true';
    }
    return false;
  });
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Persist public mode
  useEffect(() => {
    localStorage.setItem('ks_public_mode', isPublicMode.toString());
  }, [isPublicMode]);

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelection(null);
      return;
    }

    let range = sel.getRangeAt(0).cloneRange();
    const originalText = range.toString();
    
    // Trim range logic
    const leadingMatch = originalText.match(/^\s+/);
    const trailingMatch = originalText.match(/\s+$/);
    
    if (leadingMatch || trailingMatch) {
      try {
        const leadingCount = leadingMatch ? leadingMatch[0].length : 0;
        const trailingCount = trailingMatch ? trailingMatch[0].length : 0;
        
        // Very basic trimming - only works if start/end are text nodes and have room
        // This covers 99% of user selection cases
        if (leadingCount > 0 && range.startContainer.nodeType === Node.TEXT_NODE) {
          range.setStart(range.startContainer, range.startOffset + leadingCount);
        }
        if (trailingCount > 0 && range.endContainer.nodeType === Node.TEXT_NODE) {
          range.setEnd(range.endContainer, range.endOffset - trailingCount);
        }
      } catch (e) {
        // Fallback to original range if trimming fails
        range = sel.getRangeAt(0).cloneRange();
      }
    }

    const text = range.toString().trim();
    if (!text) {
      setSelection(null);
      return;
    }

    const rect = range.getBoundingClientRect();

    // Prevent highlighting in blockquotes, pre, or code tags
    const isInsideExcluded = !!(
      range.startContainer.parentElement?.closest('blockquote, pre, code') ||
      range.endContainer.parentElement?.closest('blockquote, pre, code')
    );

    if (isInsideExcluded) {
      setSelection(null);
      return;
    }

    const isHighlighted = !!(
      range.startContainer.parentElement?.closest('.ks-highlight') ||
      range.endContainer.parentElement?.closest('.ks-highlight')
    );

    setSelection({ text, range, rect, isHighlighted });
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [handleSelection]);

  if (!selection) return null;

  const canPublic = isAuthor && (onPublicHighlight || onAddPublicNote);

  return (
    <AnimatePresence>
      <motion.div
        ref={toolbarRef}
        onMouseDown={(e) => e.preventDefault()}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className={`fixed z-[100] flex items-center gap-1 p-1 backdrop-blur-xl border rounded-full shadow-2xl transition-all duration-300 ${
          isPublicMode 
            ? 'bg-slate-900/95 border-violet-500/30' 
            : 'bg-slate-900/95 border-white/10'
        }`}
        style={{
          left: selection.rect.left + selection.rect.width / 2,
          top: selection.rect.top - 58,
          transform: 'translateX(-50%)',
        }}
      >
        {/* Section 1: Colors */}
        <div className="flex items-center gap-1 px-1.5 mr-1">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center ${
                activeColor.id === c.id ? 'border-white scale-110' : 'border-transparent opacity-40 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.color }}
            >
              {activeColor.id === c.id && <Check className="w-3 h-3 text-slate-900" />}
            </button>
          ))}
        </div>

        {/* Section 2: Actions */}
        <div className="flex items-center gap-0.5 border-l border-white/10 pl-1">
          <button
            onClick={() => {
              if (isPublicMode && onPublicHighlight) {
                onPublicHighlight(selection.text, selection.range, activeColor.id);
              } else {
                onHighlight(selection.text, selection.range, activeColor.color);
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
              isPublicMode ? 'text-violet-200 hover:bg-violet-500/20' : 'text-white hover:bg-white/10'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" style={{ color: activeColor.color }} />
            <span>Highlight</span>
          </button>

          <button
            onClick={() => {
              if (isPublicMode && onAddPublicNote) {
                onAddPublicNote(selection.text, selection.range);
              } else {
                onAddNote(selection.text, selection.range);
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
              isPublicMode ? 'text-violet-200 hover:bg-violet-500/20' : 'text-white hover:bg-white/10'
            }`}
          >
            <FileEdit className={`w-3.5 h-3.5 ${isPublicMode ? 'text-violet-400' : 'text-slate-400'}`} />
            <span>Ghi chú</span>
          </button>
          
          {selection.isHighlighted && !isPublicMode && (
             <button
               onClick={() => {
                 onRemoveHighlight(selection.range);
                 setSelection(null);
               }}
               className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-full transition-colors ml-1"
             >
               <Eraser className="w-3.5 h-3.5" />
             </button>
          )}
        </div>

        {/* Section 3: Unified Visibility Toggle (Author Only) */}
        {isAuthor && (
          <button
            onClick={() => setIsPublicMode(!isPublicMode)}
            className={`flex items-center gap-2 px-3 py-1.5 ml-1 rounded-full text-[10px] font-bold transition-all border-l border-white/10 ${
              isPublicMode 
                ? 'bg-violet-500/30 text-violet-200 ring-1 ring-violet-500/40' 
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {isPublicMode ? (
              <>
                <Globe className="w-3 h-3 text-violet-400" />
                <span>CÔNG KHAI</span>
              </>
            ) : (
              <>
                <Shield className="w-3 h-3 text-blue-400" />
                <span>CÁ NHÂN</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={() => setSelection(null)}
          className="ml-1 p-1 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
