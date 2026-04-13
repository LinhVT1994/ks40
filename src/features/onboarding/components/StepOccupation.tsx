'use client';

import { Occupation } from '@prisma/client';
import { ArrowRight, Loader2 } from 'lucide-react';

const OPTIONS: { value: Occupation; label: string; emoji: string }[] = [
  { value: 'STUDENT',         label: 'Sinh viên',   emoji: '🎓' },
  { value: 'DEVELOPER',       label: 'Developer',    emoji: '💻' },
  { value: 'DEVOPS_ENGINEER', label: 'DevOps / SRE', emoji: '⚙️' },
  { value: 'DATA_SCIENTIST',  label: 'Data / AI',    emoji: '🤖' },
  { value: 'OTHER',           label: 'Khác',         emoji: '🙌' },
];

interface Props {
  value: Occupation | null;
  onChange: (v: Occupation) => void;
  onNext: () => void;
  onSkip: () => void;
  isPending: boolean;
}

export default function StepOccupation({ value, onChange, onNext, onSkip, isPending }: Props) {
  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Bước 1 / 2</p>
        <h1 className="text-xl font-bold text-zinc-800 dark:text-white">Bạn đang làm gì? 👋</h1>
        <p className="text-zinc-500 dark:text-slate-400 text-sm">Chọn vai trò phù hợp nhất với bạn.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {OPTIONS.map(({ value: v, label, emoji }) => {
          const isActive = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                  : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-700 dark:text-slate-300 hover:border-primary/50 hover:bg-primary/5'
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
          onClick={onSkip}
          disabled={isPending}
          className="text-sm text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
        >
          Bỏ qua tất cả
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!value || isPending}
          className="flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 active:scale-95"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Tiếp theo <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}
