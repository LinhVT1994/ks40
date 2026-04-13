'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileEdit, Sparkles } from 'lucide-react';

interface NotePopoverProps {
  rect: DOMRect;
  content: string;
  onClose: () => void;
  onEdit?: () => void;
}

export default function NotePopover({ rect, content, onClose, onEdit }: NotePopoverProps) {
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
        className="fixed z-[101] w-[320px] rounded-[1.25rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border border-white/40 dark:border-white/10 backdrop-blur-3xl max-md:backdrop-blur-lg bg-white/60 dark:bg-slate-900/60 overflow-hidden group"
        style={{
          left: Math.max(16, Math.min(window.innerWidth - 336, rect.left + rect.width / 2)),
          top: showAbove ? rect.top - 16 : rect.bottom + 12,
          transform: `translate(-50%, ${showAbove ? '-100%' : '0'})`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Vision Pro style glowing ambient orbs */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 dark:bg-primary/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/10 dark:bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />

        <div className="relative z-10 p-5">
          {/* Elegant Micro-Header */}
          <div className="flex items-center justify-between mb-3 border-b border-zinc-200 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white shadow-sm shadow-primary/20">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-slate-400">
                Ghi chú
              </span>
            </div>
            
            <div className="flex items-center gap-1">
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
          <p className="text-[15px] leading-relaxed text-zinc-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </motion.div>
    </>
  );
}
