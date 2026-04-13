'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
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
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter(c => c !== id) : [...value, id]);
  };

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Bước 2 / 2</p>
        <h1 className="text-xl font-bold text-zinc-800 dark:text-white">Bạn quan tâm gì? ✨</h1>
        <p className="text-zinc-500 dark:text-slate-400 text-sm">Chọn ít nhất 1 chủ đề để cá nhân hóa feed.</p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {topics.map(topic => {
          const isActive = value.includes(topic.id);
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => toggle(topic.id)}
              style={isActive ? { borderColor: topic.color ?? undefined, backgroundColor: topic.color ?? undefined } : undefined}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-lg scale-105'
                  : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-700 dark:text-slate-300 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-white/10'
              }`}
            >
              {topic.emoji && <span>{topic.emoji}</span>}
              {topic.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSkip}
            disabled={isPending}
            className="text-sm text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
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
