'use client';

import React, { useState, useTransition } from 'react';
import { 
  X, 
  Lightbulb, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  Type, 
  Tag, 
  Info,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitGlossaryTermAction } from '@/features/admin/actions/glossary';
import type { TopicItem } from '@/features/admin/actions/topic';
import TopicSelector from '@/components/shared/editor/TopicSelector';
import { toast } from 'sonner';

interface GlossarySubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicItem[];
  initialTerm?: string;
}

export default function GlossarySubmissionModal({ isOpen, onClose, topics, initialTerm }: GlossarySubmissionModalProps) {
  const [term, setTerm] = useState(initialTerm || '');
  const [shortDef, setShortDef] = useState('');
  const [topicId, setTopicId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  // Update term when initialTerm changes and modal opens
  React.useEffect(() => {
    if (isOpen && initialTerm) {
      setTerm(initialTerm);
    }
  }, [isOpen, initialTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !topicId || !shortDef.trim()) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    startTransition(async () => {
      const result = await submitGlossaryTermAction({
        term: term.trim(),
        shortDef: shortDef.trim(),
        topicId: topicId || null,
      });

      if (result.success) {
        toast.success('Cảm ơn bạn! Đề xuất đã được gửi và đang chờ duyệt.');
        onClose();
        // Reset after modal animation
        setTimeout(() => {
          setTerm('');
          setShortDef('');
          setTopicId('');
        }, 500);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10"
          >
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-zinc-800 dark:text-white">Đề xuất thuật ngữ</h2>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 transition-all hover:scale-110 active:scale-95">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Term Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      <Type className="w-3.5 h-3.5" /> Tên thuật ngữ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      autoFocus
                      value={term}
                      onChange={e => setTerm(e.target.value)}
                      placeholder="Ví dụ: P/E Ratio, Hợp đồng thông minh..."
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-zinc-800 dark:text-white placeholder:text-zinc-400"
                    />
                  </div>

                  {/* Topic Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5" /> Chủ đề <span className="text-rose-500">*</span>
                    </label>
                    <TopicSelector 
                      topics={topics}
                      selectedId={topicId}
                      onSelect={setTopicId}
                    />
                  </div>

                  {/* Short Definition */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <Info className="w-3.5 h-3.5" /> Định nghĩa ngắn gọn <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-zinc-400">{shortDef.length}/200</span>
                    </div>
                    <textarea
                      value={shortDef}
                      onChange={e => setShortDef(e.target.value)}
                      rows={3}
                      maxLength={200}
                      placeholder="Một câu tóm tắt ý nghĩa của thuật ngữ này..."
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-zinc-800 dark:text-white placeholder:text-zinc-400 leading-relaxed text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-4 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-all"
                    >
                      Để sau
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || !term.trim() || !topicId || !shortDef.trim()}
                      className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-zinc-800 dark:bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-primary/20 active:scale-95"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Gửi đề xuất
                    </button>
                  </div>
                </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
