'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Check } from 'lucide-react';

interface HighlightActionToolbarProps {
  element: HTMLElement;
  rect: DOMRect;
  onDelete: () => void;
  onChangeColor: (colorId: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isVisible: boolean;
  hideColors?: boolean;
}

const HIGHLIGHT_COLORS = [
  { id: 'yellow', color: '#fef08a', label: 'Vàng' },
  { id: 'green',  color: '#bbf7d0', label: 'Xanh lá' },
  { id: 'blue',   color: '#bfdbfe', label: 'Xanh dương' },
  { id: 'pink',   color: '#fbcfe8', label: 'Hồng' },
];

export default function HighlightActionToolbar({
  element,
  rect,
  onDelete,
  onChangeColor,
  onMouseEnter,
  onMouseLeave,
  isVisible,
  hideColors = false,
}: HighlightActionToolbarProps) {
  const currentColor = element.style.backgroundColor;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          data-highlight-toolbar="true"
          className="fixed z-[110] flex items-center gap-1 p-1 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl"
          style={{
            left: rect.left + rect.width / 2,
            top: rect.top - 48,
            transform: 'translateX(-50%)',
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {/* Color Picker */}
          {!hideColors && (
            <>
              <div className="flex items-center gap-1.5 px-2">
                {HIGHLIGHT_COLORS.map((c) => {
                  const isActive = element.getAttribute('data-color') === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => onChangeColor(c.id)}
                      className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center ${
                        isActive ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    >
                      {isActive && <Check className="w-3 h-3 text-zinc-800" />}
                    </button>
                  );
                })}
              </div>
              <div className="w-px h-4 bg-white/10 mx-1" />
            </>
          )}

          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 rounded-full transition-colors group"
            title="Xóa Highlight"
          >
            <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Xóa</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
