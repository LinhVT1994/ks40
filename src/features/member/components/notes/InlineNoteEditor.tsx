'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileEdit, Globe, Shield } from 'lucide-react';

interface InlineNoteEditorProps {
  selection: { rect: DOMRect };
  initialValue?: string;
  initialPublic?: boolean;
  onSave: (note: string, isPublic: boolean) => void;
  onCancel: () => void;
  isAuthor?: boolean;
}

export default function InlineNoteEditor({ 
  selection, 
  initialValue = '', 
  initialPublic = false,
  onSave, 
  onCancel,
  isAuthor 
}: InlineNoteEditorProps) {
  const [note, setNote] = useState(initialValue);
  const [isPublic, setIsPublic] = useState(initialPublic);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const showAbove = selection.rect.top > 80;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: showAbove ? 10 : -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: showAbove ? 10 : -10 }}
      className="fixed z-[101] w-[320px] bg-white dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-zinc-200 dark:border-white/10 overflow-hidden"
      style={{
        left: `calc(${selection.rect.left + selection.rect.width / 2}px)`,
        top: showAbove ? undefined : selection.rect.bottom + 12,
        bottom: showAbove ? `calc(100vh - ${selection.rect.top}px + 12px)` : undefined,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileEdit className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[12px] font-bold text-slate-600 dark:text-slate-200">Ghi chú</p>
        </div>
        
        {isAuthor && (
          <div 
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full cursor-pointer transition-all ${
              isPublic 
                ? 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30' 
                : 'bg-slate-100 dark:bg-white/5 text-slate-400'
            }`}
          >
            {isPublic ? <Globe className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
            <span className="text-[9px] font-black uppercase tracking-wider">
              {isPublic ? 'Công khai' : 'Cá nhân'}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nhập nội dung ghi chú ở đây..."
          className="w-full h-24 bg-transparent text-[14px] text-zinc-800 dark:text-slate-200 placeholder:text-slate-500 resize-none outline-none font-medium leading-relaxed custom-scrollbar"
        />
      </div>

      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="text-[10px] text-slate-400 font-medium italic">
          {isPublic ? 'Mọi người đều sẽ thấy' : 'Chỉ bạn mới thấy'}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(note, isPublic)}
            disabled={!note.trim()}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-bold rounded-xl disabled:opacity-50 transition-all ${
              isPublic 
                ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20' 
                : 'bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black shadow-lg shadow-black/10'
            }`}
          >
            Lưu lại
          </button>
        </div>
      </div>
    </motion.div>
  );
}
