'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, Loader2, ChevronRight, Check, X } from 'lucide-react';
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

export default function StepCategories({ value, onChange, onBack, onComplete, onSkip, isPending, topics }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group topics by parent
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
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Bước 2 / 2</p>
        <h1 className="text-xl font-bold text-zinc-800 dark:text-white">Bạn quan tâm gì? ✨</h1>
        <p className="text-zinc-500 dark:text-slate-400 text-sm">Chọn các lĩnh vực và chủ đề cụ thể để cá nhân hóa feed.</p>
      </div>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200">
        {grouped.map(category => {
          const isExpanded = expandedId === category.id;
          const childIds = category.children.map(c => c.id);
          const selectedInCat = childIds.filter(id => value.includes(id)).length;
          const allSelected = selectedInCat === childIds.length && childIds.length > 0;

          return (
            <div 
              key={category.id} 
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                isExpanded ? 'border-primary/30 ring-1 ring-primary/10' : 'border-zinc-200 dark:border-white/5'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : category.id)}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                  isExpanded ? 'bg-primary/5' : 'hover:bg-zinc-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{category.emoji}</span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">{category.label}</h3>
                    {selectedInCat > 0 && (
                      <p className="text-[10px] font-bold text-primary mt-0.5">
                        Đã chọn {selectedInCat}/{childIds.length} chủ đề
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => toggleAllInCategory(category, e)}
                    className={`p-1.5 rounded-lg transition-all ${
                      allSelected 
                        ? 'bg-primary text-white' 
                        : 'bg-zinc-100 dark:bg-white/10 text-zinc-400 hover:text-primary hover:bg-primary/10'
                    }`}
                    title={allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  >
                    {allSelected ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />}
                  </button>
                  <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 pt-0 bg-white dark:bg-zinc-900/50">
                  <div className="h-px bg-zinc-100 dark:bg-white/5 mb-4" />
                  <div className="flex flex-wrap gap-2">
                    {category.children.map(child => {
                      const isActive = value.includes(child.id);
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => toggleTopic(child.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            isActive
                              ? 'bg-primary/10 border-primary/30 text-primary'
                              : 'border-zinc-200 dark:border-white/10 text-zinc-500 hover:border-zinc-300'
                          }`}
                        >
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/5">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSkip}
            disabled={isPending}
            className="text-sm font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
          >
            Bỏ qua
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={value.length === 0 || isPending}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 active:scale-95"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Bắt đầu khám phá 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}
