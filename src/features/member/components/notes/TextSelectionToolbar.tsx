'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Highlighter, FileEdit, X, Check, Eraser, Users } from 'lucide-react';

interface TextSelectionToolbarProps {
  onAddNote: (text: string, range: Range) => void;
  onHighlight: (text: string, range: Range, color: string) => void;
  onRemoveHighlight: (range: Range) => void;
  isAuthor?: boolean;
  onAddPublicNote?: (text: string, range: Range) => void;
  onPublicHighlight?: (text: string, range: Range) => void;
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
  const [isPublicMode, setIsPublicMode] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    if (!text) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0).cloneRange();
    const rect = range.getBoundingClientRect();

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

  // Reset public mode when selection clears
  useEffect(() => {
    if (!selection) setIsPublicMode(false);
  }, [selection]);

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
        className={`fixed z-[100] flex items-center gap-1 p-1 backdrop-blur-xl border rounded-full shadow-2xl transition-colors duration-200 ${
          isPublicMode
            ? 'bg-violet-950/90 border-violet-500/40'
            : 'bg-zinc-800/90 border-white/10'
        }`}
        style={{
          left: selection.rect.left + selection.rect.width / 2,
          top: selection.rect.top - 54,
          transform: 'translateX(-50%)',
        }}
      >
        {/* Color Picker — hidden in public mode (author marks are always violet) */}
        {!isPublicMode && (
          <>
            <div className="flex items-center gap-1.5 px-2">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center ${
                    activeColor.id === c.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                >
                  {activeColor.id === c.id && <Check className="w-3 h-3 text-zinc-800" />}
                </button>
              ))}
            </div>
            <div className="w-px h-4 bg-white/10 mx-1" />
          </>
        )}

        {/* Highlight */}
        <button
          onClick={() => {
            if (isPublicMode && onPublicHighlight) {
              onPublicHighlight(selection.text, selection.range);
            } else {
              onHighlight(selection.text, selection.range, activeColor.color);
            }
          }}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors group ${
            isPublicMode
              ? 'text-violet-200 hover:bg-violet-500/30'
              : 'text-white hover:bg-white/10'
          }`}
        >
          <Highlighter
            className="w-3.5 h-3.5"
            style={isPublicMode ? undefined : { color: activeColor.color }}
          />
          <span>Highlight</span>
        </button>

        {/* Remove highlight (personal mode only) */}
        {!isPublicMode && selection.isHighlighted && (
          <button
            onClick={() => {
              onRemoveHighlight(selection.range);
              setSelection(null);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-full transition-colors group"
            title="Xóa Highlight"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>
        )}

        <div className={`w-px h-4 mx-1 ${isPublicMode ? 'bg-violet-500/30' : 'bg-white/10'}`} />

        {/* Note */}
        <button
          onClick={() => {
            if (isPublicMode && onAddPublicNote) {
              onAddPublicNote(selection.text, selection.range);
            } else {
              onAddNote(selection.text, selection.range);
            }
          }}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors group ${
            isPublicMode
              ? 'text-violet-200 hover:bg-violet-500/30'
              : 'text-white hover:bg-white/10'
          }`}
        >
          <FileEdit className={`w-3.5 h-3.5 ${isPublicMode ? 'text-violet-400' : 'text-primary'}`} />
          <span>Ghi chú</span>
        </button>

        {/* Public mode toggle (author only) */}
        {canPublic && (
          <>
            <div className={`w-px h-4 mx-1 ${isPublicMode ? 'bg-violet-500/30' : 'bg-white/10'}`} />
            <button
              onClick={() => setIsPublicMode(v => !v)}
              title={isPublicMode ? 'Đang ở chế độ công khai — nhấn để chuyển về cá nhân' : 'Chuyển sang chế độ công khai (hiện với tất cả độc giả)'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                isPublicMode
                  ? 'bg-violet-500/40 text-violet-200 ring-1 ring-violet-400/50'
                  : 'text-white/40 hover:text-violet-300 hover:bg-violet-500/15'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {isPublicMode && <span>Công khai</span>}
            </button>
          </>
        )}

        <button
          onClick={() => setSelection(null)}
          className={`ml-1 p-1.5 rounded-full transition-colors ${
            isPublicMode ? 'text-violet-300/50 hover:text-violet-200' : 'text-white/40 hover:text-white'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
