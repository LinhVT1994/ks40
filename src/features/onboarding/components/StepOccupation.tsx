'use client';

import { ArrowRight, Loader2 } from 'lucide-react';
import type { OccupationOption } from '@/features/onboarding/actions/onboarding';

interface Props {
  value: string | null;
  onChange: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
  isPending: boolean;
  options: OccupationOption[];
}

export default function StepOccupation({ value, onChange, onNext, onSkip, isPending, options }: Props) {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Bước 1 / 2</p>
        <h1 className="text-xl font-bold text-zinc-800 dark:text-white">Bạn đang làm gì? 👋</h1>
        <p className="text-zinc-500 dark:text-slate-400 text-sm">Chọn vai trò phù hợp nhất để chúng tôi gợi ý nội dung cho bạn.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {options.map(({ value: v, label, emoji, description }) => {
          const isActive = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`flex flex-col items-start gap-1 px-4 py-3 rounded-2xl border-2 text-left transition-all duration-200 ${
                isActive
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm shadow-primary/10 scale-[1.02]'
                  : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-primary/40 hover:bg-zinc-50 dark:hover:bg-white/[0.07]'
              }`}
            >
              {emoji && <span className="text-xl leading-none">{emoji}</span>}
              <span className={`text-sm font-bold leading-snug ${isActive ? 'text-primary' : 'text-zinc-800 dark:text-white'}`}>
                {label}
              </span>
              {description && (
                <span className="text-[11px] text-zinc-400 dark:text-slate-500 leading-tight">{description}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
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
