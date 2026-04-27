'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileEdit, PenLine, Trash2 } from 'lucide-react';

interface NotePopoverProps {
  rect: DOMRect;
  content: string;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAuthorNote?: boolean;
}

export default function NotePopover({ rect, content, onClose, onEdit, onDelete, isAuthorNote }: NotePopoverProps) {
  // Aggressively show above the highlight
  const showAbove = rect.top > 80; 

  return (
    <>
      <div
        className="fixed inset-0 z-[100]"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: showAbove ? 10 : -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: showAbove ? 10 : -10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed z-[101] w-[300px] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] border bg-white dark:bg-[#151515] overflow-hidden group ${
          isAuthorNote
            ? 'border-violet-300/50 dark:border-violet-500/30'
            : 'border-zinc-200 dark:border-white/10'
        }`}
        style={{
          left: Math.max(16, Math.min(window.innerWidth - 336, rect.left + rect.width / 2)),
          top: showAbove ? undefined : rect.bottom + 12,
          bottom: showAbove ? `calc(100vh - ${rect.top}px + 12px)` : undefined,
          transform: `translateX(-50%)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className={`flex items-center justify-between mb-3 border-b pb-2.5 ${
            isAuthorNote ? 'border-violet-100 dark:border-violet-500/20' : 'border-zinc-100 dark:border-white/5'
          }`}>
            <div className="flex items-center gap-2">
              <PenLine className={`w-3.5 h-3.5 ${isAuthorNote ? 'text-violet-400' : 'text-zinc-400'}`} />
              <span className={`text-[12px] font-bold tracking-tight ${
                isAuthorNote ? 'text-violet-500 uppercase tracking-wider' : 'text-zinc-600 dark:text-slate-400'
              }`}>
                {isAuthorNote ? 'Ghi chú của tác giả' : 'Ghi chú'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm('Bạn có chắc muốn xoá ghi chú này vĩnh viễn?')) {
                      onDelete();
                    }
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50/80 dark:hover:bg-red-500/10 transition-colors"
                  title="Xoá ghi chú"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-200"
                  title="Chỉnh sửa ghi chú"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <p className="text-[14px] leading-relaxed text-zinc-800 dark:text-slate-300 font-medium whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </motion.div>
    </>
  );
}
