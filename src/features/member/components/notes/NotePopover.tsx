'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileEdit, Sparkles, Trash2 } from 'lucide-react';

interface NotePopoverProps {
  rect: DOMRect;
  content: string;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function NotePopover({ rect, content, onClose, onEdit, onDelete }: NotePopoverProps) {
  // If the popover would go off the bottom of the screen, show it above the text.
  const showAbove = rect.bottom + 150 > window.innerHeight;

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
        initial={{ opacity: 0, scale: 0.95, y: showAbove ? -10 : 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: showAbove ? -10 : 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed z-[101] w-[300px] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#202020] overflow-hidden group"
        style={{
          left: Math.max(16, Math.min(window.innerWidth - 336, rect.left + rect.width / 2)),
          top: showAbove ? rect.top - 16 : rect.bottom + 12,
          transform: `translate(-50%, ${showAbove ? '-100%' : '0'})`,
        }}
        onClick={(e) => e.stopPropagation()}
      >

        <div className="p-4">
          {/* Elegant Micro-Header */}
          <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
                Ghi chú 
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
          
          {/* Note Content */}
          <p className="text-[14px] leading-relaxed text-zinc-800 dark:text-zinc-200 font-medium whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </motion.div>
    </>
  );
}
