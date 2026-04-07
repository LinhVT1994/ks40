'use client';

import { ArticleCategory } from '@prisma/client';
import { ArrowLeft, Loader2 } from 'lucide-react';

const CATEGORIES: { value: ArticleCategory; label: string; emoji: string; active: string }[] = [
  { value: 'SYSTEM_DESIGN', label: 'System Design', emoji: '🏗️', active: 'border-violet-500 bg-violet-500 text-white shadow-violet-500/25' },
  { value: 'AI_ML',         label: 'AI / ML',        emoji: '🤖', active: 'border-orange-500 bg-orange-500 text-white shadow-orange-500/25' },
  { value: 'DEVOPS',        label: 'DevOps',          emoji: '⚙️', active: 'border-emerald-500 bg-emerald-500 text-white shadow-emerald-500/25' },
  { value: 'BLOCKCHAIN',    label: 'Blockchain',      emoji: '🔗', active: 'border-yellow-500 bg-yellow-500 text-white shadow-yellow-500/25' },
  { value: 'FRONTEND',      label: 'Frontend',        emoji: '🎨', active: 'border-pink-500 bg-pink-500 text-white shadow-pink-500/25' },
  { value: 'BACKEND',       label: 'Backend',         emoji: '🔧', active: 'border-blue-500 bg-blue-500 text-white shadow-blue-500/25' },
  { value: 'OTHER',         label: 'Khác',            emoji: '📚', active: 'border-slate-500 bg-slate-500 text-white shadow-slate-500/25' },
];

interface Props {
  value: ArticleCategory[];
  onChange: (v: ArticleCategory[]) => void;
  onBack: () => void;
  onComplete: () => void;
  onSkip: () => void;
  isPending: boolean;
}

export default function StepCategories({ value, onChange, onBack, onComplete, onSkip, isPending }: Props) {
  const toggle = (cat: ArticleCategory) => {
    onChange(value.includes(cat) ? value.filter(c => c !== cat) : [...value, cat]);
  };

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Bước 2 / 2</p>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bạn quan tâm gì? ✨</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Chọn ít nhất 1 chủ đề để cá nhân hóa feed.</p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {CATEGORIES.map(({ value: v, label, emoji, active: activeClass }) => {
          const isActive = value.includes(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => toggle(v)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? `${activeClass} shadow-lg scale-105`
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10'
              }`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSkip}
            disabled={isPending}
            className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
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
