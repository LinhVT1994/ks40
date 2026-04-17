'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, ChevronRight, Check } from 'lucide-react';
import type { TopicItem } from '@/features/admin/actions/topic';

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  onBack: () => void;
  onComplete: () => void;
  onSkip: () => void;
  isPending: boolean;
  topics: TopicItem[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }
};

export default function StepCategories({ value, onChange, onBack, onComplete, onSkip, isPending, topics }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const parents = topics.filter(t => !t.parentId);
    const children = topics.filter(t => !!t.parentId);
    return parents.map(p => ({
      ...p,
      children: children.filter(c => c.parentId === p.id)
    })).filter(p => p.children.length > 0 || (p._count?.articles ?? 0) > 0);
  }, [topics]);

  const toggleTopic = (id: string) => {
    onChange(value.includes(id) ? value.filter(c => c !== id) : [...value, id]);
  };

  const toggleAllInCategory = (category: typeof grouped[0], e: React.MouseEvent) => {
    e.stopPropagation();
    const childIds = category.children.map(c => c.id);
    const allSelected = childIds.every(id => value.includes(id));
    if (allSelected) {
      onChange(value.filter(id => !childIds.includes(id)));
    } else {
      const uniqueNewIds = childIds.filter(id => !value.includes(id));
      onChange([...value, ...uniqueNewIds]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Compact Header - Left aligned */}
      <div className="text-left space-y-4 px-2">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight"
        >
          Bạn quan tâm gì?
        </motion.h1>
      </div>

      {/* Grid for Categories */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-100 dark:scrollbar-thumb-white/5"
      >
        {grouped.map(category => {
          const isExpanded = expandedId === category.id;
          const childIds = category.children.map(c => c.id);
          const selectedInCat = childIds.filter(id => value.includes(id)).length;
          const allSelected = selectedInCat === childIds.length && childIds.length > 0;

          return (
            <motion.div 
              key={category.id} 
              variants={item}
              className={`rounded-xl transition-all duration-300 border ${
                isExpanded ? 'bg-zinc-50 dark:bg-white/[0.03] border-zinc-300 dark:border-white/10' : 'border-zinc-200 dark:border-white/5 hover:border-zinc-300'
              } ${isExpanded ? 'col-span-full' : ''}`}
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : category.id)}
                className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg opacity-80">{category.emoji}</span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-zinc-800 dark:text-white truncate">{category.label}</h3>
                    {selectedInCat > 0 && (
                      <p className="text-[9px] font-bold text-zinc-400 mt-0.5">
                        Selected {selectedInCat}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => toggleAllInCategory(category, e)}
                    className={`p-1 rounded-md transition-all ${
                      allSelected 
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' 
                        : 'text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="px-4 pb-4 flex flex-wrap gap-2">
                      {category.children.map(child => {
                        const isActive = value.includes(child.id);
                        return (
                          <motion.button
                            key={child.id}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                            onClick={() => toggleTopic(child.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${
                              isActive
                                ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900'
                                : 'border-zinc-200 dark:border-white/10 text-zinc-500 hover:border-zinc-300'
                            }`}
                          >
                            {child.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Compact Navigation */}
      <div className="space-y-4 pt-4 border-t border-zinc-50 dark:border-white/5">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isPending}
            className="h-12 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={onComplete}
            disabled={value.length === 0 || isPending}
            className="h-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold transition-all disabled:opacity-20 shadow-lg shadow-zinc-900/5 dark:shadow-none"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hoàn tất'}
          </motion.button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={onSkip}
            disabled={isPending}
            className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors uppercase tracking-widest"
          >
            Tôi sẽ chọn sau
          </button>
        </div>
      </div>
    </div>
  );
}
