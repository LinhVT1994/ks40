'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileEdit } from 'lucide-react';

interface InlineNoteEditorProps {
  selection: { rect: DOMRect };
  initialValue?: string;
  onSave: (note: string) => void;
  onCancel: () => void;
}

export default function InlineNoteEditor({ selection, initialValue = '', onSave, onCancel }: InlineNoteEditorProps) {
  const [note, setNote] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const showAbove = selection.rect.bottom + 180 > window.innerHeight;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: showAbove ? -10 : 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: showAbove ? -10 : 10 }}
      className="fixed z-[101] w-[300px] bg-white dark:bg-[#202020] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-200 dark:border-white/10 overflow-hidden"
      style={{
        left: `calc(${selection.rect.left + selection.rect.width / 2}px)`,
        top: showAbove ? selection.rect.top - 180 : selection.rect.bottom + 8,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5 flex items-center gap-2">
        <FileEdit className="w-3.5 h-3.5 text-zinc-400" />
        <p className="text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">Viết ghi chú</p>
      </div>

      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nhập nội dung ghi chú ở đây..."
          className="w-full h-20 bg-transparent text-[14px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 resize-none outline-none font-medium leading-snug custom-scrollbar"
        />
      </div>

      <div className="px-4 pb-4 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-[12px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={() => onSave(note)}
          disabled={!note.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black text-[12px] font-medium rounded-md disabled:opacity-50 transition-colors"
        >
          Lưu lại
        </button>
      </div>
    </motion.div>
  );
}
