'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Quote, FileEdit } from 'lucide-react';

interface InlineNoteEditorProps {
  selection: { text: string; range: Range; rect: DOMRect };
  onSave: (note: string) => void;
  onCancel: () => void;
}

export default function InlineNoteEditor({ selection, onSave, onCancel }: InlineNoteEditorProps) {
  const [note, setNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Calculate if we should show above or below
  const showAbove = selection.rect.bottom + 240 > window.innerHeight;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: showAbove ? -10 : 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: showAbove ? -10 : 10 }}
      className="fixed z-[101] w-[300px] bg-white/95 dark:bg-slate-900/95 rounded-[1.25rem] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-white/10 overflow-hidden backdrop-blur-2xl"
      style={{
        left: `calc(${selection.rect.left + selection.rect.width / 2}px)`,
        top: showAbove ? selection.rect.top - 240 : selection.rect.bottom + 8,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Header */}
      <div className="py-2.5 px-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2">
          <FileEdit className="w-3.5 h-3.5 text-primary opacity-80" />
          <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">
            Ghi chú
          </p>
        </div>
      </div>
      
      {/* Input Section */}
      <div className="p-3">
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nhập nội dung ghi chú..."
          className="w-full h-24 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none outline-none font-medium leading-relaxed"
        />
      </div>
      
      {/* Footer Actions */}
      <div className="px-3 pb-3 flex items-center justify-between gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={() => onSave(note)}
          disabled={!note.trim()}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-xs font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all uppercase tracking-tight"
        >
          <Save className="w-3.5 h-3.5" />
          Lưu lại
        </button>
      </div>
    </motion.div>
  );
}
